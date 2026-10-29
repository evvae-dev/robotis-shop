import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://www.robotis.com";
const sourceUrls = {
  home: `${origin}/shop/`,
  list: `${origin}/shop/list.php?ca_id=2050`,
  detail: `${origin}/shop/item.php?it_id=905-0058-000`,
};
const clean = (value = "") => value.replace(/\s+/g, " ").trim();
const absolute = (value) => value ? new URL(value, origin).href : "";
const productId = (href) => new URL(absolute(href)).searchParams.get("it_id");
const mediaDirectory = path.join(root, "public", "media");
await mkdir(mediaDirectory, { recursive: true });

async function fetchHtml(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`원본 페이지 조회 실패: ${response.status} ${url}`);
  return load(await response.text());
}

const mediaCache = new Map();
async function mirrorImage(source) {
  if (!source) return "";
  const url = absolute(source);
  if (mediaCache.has(url)) return mediaCache.get(url);
  const name = `${createHash("sha256").update(url).digest("hex").slice(0, 18)}${path.extname(new URL(url).pathname) || ".png"}`;
  const localUrl = `/media/${name}`;
  const file = path.join(mediaDirectory, name);
  try {
    await readFile(file);
  } catch {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`이미지 수집 실패: ${response.status} ${url}`);
    await writeFile(file, Buffer.from(await response.arrayBuffer()));
  }
  mediaCache.set(url, localUrl);
  return localUrl;
}

const home = await fetchHtml(sourceUrls.home);
const list = await fetchHtml(sourceUrls.list);
const crawlTime = new Date().toISOString();
const productSeeds = new Map();

// 같은 상품이 메인과 목록에 반복되어도 원본 상품코드를 기준으로 한 번만 수집합니다.
function collectProducts(document, categoryId = null) {
  document(".sct_li").each((_, element) => {
    const unit = document(element);
    const href = unit.find('.sct_txt a[href*="it_id="]').first().attr("href");
    if (!href) return;
    const id = productId(href);
    const previous = productSeeds.get(id);
    productSeeds.set(id, {
      ...previous,
      id,
      name: clean(unit.find(".sct_txt").text()),
      summary: clean(unit.find(".sct_basic").text()) || previous?.summary || "",
      sourceUrl: `${origin}/shop/item.php?it_id=${id}`,
      thumbnail: absolute(unit.find(".sct_img img").attr("src")),
      categoryIds: [...new Set([...(previous?.categoryIds || []), ...(categoryId ? [categoryId] : [])])],
    });
  });
}
collectProducts(home);
collectProducts(list, "2050");

const homeSections = home(".sct_wrap").map((index, element) => {
  const section = home(element);
  return {
    id: ["new", "recommended", "education", "bulk"][index],
    title: clean(section.find("h2").first().text()),
    subtitle: clean(section.find("h2").first().parent().text()).replace(clean(section.find("h2").first().text()), "").trim(),
    productIds: section.find('.sct_txt a[href*="it_id="]').map((_, anchor) => productId(home(anchor).attr("href"))).get(),
    order: index,
  };
}).get();

const navigation = home("#nav_drop .sub > ul").map((index, element) => {
  const links = home(element).find('a[href*="list.php?ca_id="]');
  return {
    id: ["actuators", "robots", "parts", "education"][index] || `group-${index}`,
    title: ["다이나믹셀", "전문가용 로봇", "로봇부품", "스팀컵인증키트"][index] || "고객지원",
    items: links.map((_, anchor) => ({ title: clean(home(anchor).text()), categoryId: new URL(home(anchor).attr("href"), origin).searchParams.get("ca_id") })).get(),
  };
}).get().filter((group) => group.items.length);

const desktopSlides = home(".visual_web > li").toArray();
const mobileSlides = home(".visual_mobile > li, .visual_mob > li").toArray();
const tabs = home(".shopVisualNav .visualBtn").toArray();
const banners = [];
for (const [index, slide] of desktopSlides.entries()) {
  const item = home(slide);
  const tab = home(tabs[index]);
  const sourceImageUrl = absolute(item.find("img").attr("src"));
  const sourceLink = absolute(item.find("a").attr("href"));
  banners.push({
    id: `hero-${index + 1}`,
    title: clean(tab.find("b").text()) || `ROBOTIS 배너 ${index + 1}`,
    imageUrl: await mirrorImage(sourceImageUrl),
    sourceImageUrl,
    thumbnailUrl: await mirrorImage(tab.find("img").attr("src")),
    mobileImageUrl: mobileSlides[index] ? await mirrorImage(home(mobileSlides[index]).find("img").attr("src")) : "",
    sourceLink,
    categoryId: new URL(sourceLink).searchParams.get("ca_id"),
    productId: new URL(sourceLink).searchParams.get("it_id"),
    order: index,
    published: true,
    sourceUpdatedAt: crawlTime,
  });
}

const products = [];
for (const banner of banners) {
  if (banner.productId && !productSeeds.has(banner.productId)) {
    productSeeds.set(banner.productId, { id: banner.productId, name: banner.title, summary: "", sourceUrl: `${origin}/shop/item.php?it_id=${banner.productId}`, thumbnail: banner.sourceImageUrl, categoryIds: [] });
  }
}
for (const [index, seed] of [...productSeeds.values()].entries()) {
  const detail = await fetchHtml(seed.sourceUrl);
  const overview = detail(".sit_ov_tbl tr").map((_, row) => ({
    label: clean(detail(row).find("th").text()),
    value: clean(detail(row).find("td").text()),
  })).get().filter((row) => row.label && row.value);
  const sourceGallery = [...new Set(detail("#sit_pvi_big img").map((_, image) => absolute(detail(image).attr("src"))).get())];
  const price = detail("#it_price").val();
  const hasPrice = price !== undefined && /^\d+$/.test(String(price)) && Number(price) > 0 && !/견적|문의/.test(overview.find((row) => row.label === "판매가격")?.value || "");
  const summary = clean(detail("#sit_desc").text()) || seed.summary;
  const categoryName = clean(detail(".l_menu_top").first().text());
  const series = seed.name.startsWith("YM") ? "Y" : /^X[WMCHDL]/.test(seed.name) ? "X" : /^P[HM]/.test(seed.name) ? "P" : "";
  const firstImage = sourceGallery[0] || seed.thumbnail;
  const imageUrl = await mirrorImage(firstImage);
  const extraCategories = series === "Y" ? ["2050", "205010"] : series === "X" ? ["2020"] : series === "P" ? ["2030"] : [];
  // 메인에 노출된 제품도 원본 메뉴에서 같은 상품군으로 탐색할 수 있도록 분류합니다.
  if (seed.name.startsWith("HX5")) extraCategories.push("4010");
  if (seed.name.startsWith("AI Worker")) extraCategories.push("408010");
  if (seed.name.startsWith("OMX")) extraCategories.push("4060");
  if (seed.name.startsWith("RM-P")) extraCategories.push("4030");
  if (categoryName.includes("교육") || /알쥐|올로|스팀컵/.test(seed.name)) extraCategories.push("1020");
  if (seed.name.startsWith("MX") || seed.name.startsWith("AX")) extraCategories.push("2010");
  const categoryIds = [...new Set([...seed.categoryIds, ...extraCategories])];
  const torqueMatch = summary.match(/([\d.]+)\s*N\s*[·.]?\s*m/i);
  const voltageMatch = summary.match(/([\d.]+)\s*V\b/i);
  const speedMatch = summary.match(/([\d,.]+)\s*rpm/i);
  const images = detail("#sit_inf_explan img").map((_, image) => absolute(detail(image).attr("src"))).get();
  const paragraphs = detail("#sit_inf_explan p").map((_, paragraph) => clean(detail(paragraph).text())).get().filter(Boolean);

  products.push({
    id: seed.id,
    name: clean(detail("#sit_title").text()) || seed.name,
    summary,
    price: hasPrice ? Number(price) : null,
    priceLabel: hasPrice ? "" : "견적 문의",
    imageUrl,
    gallery: [imageUrl, ...sourceGallery.slice(1)],
    sourceImageUrl: firstImage,
    categoryIds,
    categoryName,
    series,
    communication: /RS[- ]?485/i.test(summary) ? "RS-485" : /TTL/i.test(summary) ? "TTL" : "",
    torqueNm: torqueMatch ? Number(torqueMatch[1]) : null,
    voltageV: voltageMatch ? Number(voltageMatch[1]) : null,
    speedRpm: speedMatch ? Number(speedMatch[1].replaceAll(",", "")) : null,
    leadTime: overview.find((row) => row.label === "준비기간")?.value || "",
    manufacturer: overview.find((row) => row.label === "제조사")?.value || "",
    countryOfOrigin: overview.find((row) => row.label === "원산지")?.value || "",
    specifications: overview.filter((row) => !["판매가격", "배송비결제"].includes(row.label)),
    description: paragraphs,
    detailImages: images,
    resources: detail("#sit_inf_link a").map((_, anchor) => ({ title: clean(detail(anchor).text()), url: absolute(detail(anchor).attr("href")) })).get(),
    sourceUrl: seed.sourceUrl,
    sourceUpdatedAt: crawlTime,
    published: true,
    sortOrder: index,
  });
  console.log(`상품 수집 ${index + 1}/${productSeeds.size}: ${seed.id} ${seed.name}`);
  await new Promise((resolve) => setTimeout(resolve, 180));
}

const catalog = {
  schemaVersion: 1,
  crawledAt: crawlTime,
  sources: sourceUrls,
  products,
  banners,
  siteContent: {
    logoUrl: await mirrorImage(`${origin}/img/common/logo2_1_shop.png`),
    navigation,
    homeSections,
    shipping: [],
    returns: [],
    sourceUpdatedAt: crawlTime,
  },
};
const policySource = await fetchHtml(sourceUrls.detail);
catalog.siteContent.shipping = policySource("#sit_dvr p").map((_, element) => clean(policySource(element).text())).get().filter(Boolean);
catalog.siteContent.returns = policySource("#sit_ex p").map((_, element) => clean(policySource(element).text())).get().filter(Boolean);
await mkdir(path.join(root, "data"), { recursive: true });
await writeFile(path.join(root, "data", "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ products: products.length, banners: banners.length, navigationGroups: navigation.length, homeSections: homeSections.length, output: "data/catalog.json" }));
