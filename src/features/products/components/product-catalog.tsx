"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StoreLink } from "@/components/ui/store-link";
import { Icon } from "@/components/ui/icon";
import { productsHref } from "@/lib/format";
import type { NavigationGroup } from "@/lib/shop-types";
import type { Product } from "../types/product";
import { ProductCard } from "./product-card";

type Sort = "recommended" | "price-asc" | "price-desc" | "name";

export function ProductCatalog({ products, navigation, categoryId, query }: { products: Product[]; navigation: NavigationGroup[]; categoryId: string; query: string }) {
  const [series, setSeries] = useState<string[]>([]);
  const [communication, setCommunication] = useState<string[]>([]);
  const [torque, setTorque] = useState("all");
  const [sort, setSort] = useState<Sort>("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [keyword, setKeyword] = useState(query);
  const selectedGroup = navigation.find((group) => group.items.some((item) => item.categoryId === categoryId)) || navigation[0];
  const categoryName = navigation.flatMap((group) => group.items).find((item) => item.categoryId === categoryId)?.title || (categoryId === "all" ? "전체 상품" : categoryId === "205010" ? "YM 시리즈" : "상품 목록");
  const reset = () => { setSeries([]); setCommunication([]); setTorque("all"); setKeyword(""); };
  const count = series.length + communication.length + (torque !== "all" ? 1 : 0);
  const toggle = (value: string, values: string[], setter: (items: string[]) => void) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const categoryProducts = useMemo(() => products.filter((product) => categoryId === "all" || product.categoryIds.includes(categoryId)), [products, categoryId]);
  const filtered = useMemo(() => {
    const result = categoryProducts.filter((product) => {
      if (keyword && !`${product.name} ${product.id} ${product.summary}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (series.length && !series.includes(product.series)) return false;
      if (communication.length && !communication.includes(product.communication)) return false;
      if (torque !== "all") {
        if (product.torqueNm === null) return false;
        if (torque === "under10" && product.torqueNm >= 10) return false;
        if (torque === "10to20" && (product.torqueNm < 10 || product.torqueNm >= 20)) return false;
        if (torque === "over20" && product.torqueNm < 20) return false;
      }
      return true;
    });
    // 견적 상품은 가격순 정렬 시 마지막에 배치하고, 가격이 같은 경우 기존 순서를 유지합니다.
    return result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "en");
      if (sort === "price-asc" || sort === "price-desc") {
        if (a.price === null) return b.price === null ? 0 : 1;
        if (b.price === null) return -1;
        return sort === "price-asc" ? a.price - b.price : b.price - a.price;
      }
      return a.sortOrder - b.sortOrder;
    });
  }, [categoryProducts, keyword, series, communication, torque, sort]);

  return <main id="main" className="shop-width catalog-page">
    <div className="breadcrumbs"><Link href="/" aria-label="스토어 홈"><Icon name="home" size={13} /></Link><Icon name="chevron" size={11} /><span>{selectedGroup?.title || "상품"}</span><Icon name="chevron" size={11} /><strong>{categoryName}</strong></div>
    <div className="catalog-layout">
      <aside className={`catalog-sidebar ${filterOpen ? "mobile-open" : ""}`} aria-label="상품 카테고리와 필터">
        <div className="sidebar-heading"><h2>카테고리</h2><button type="button" className="mobile-close" aria-label="필터 닫기" onClick={() => setFilterOpen(false)}><Icon name="close" size={19} /></button></div>
        <nav className="category-tree" aria-label="상품 카테고리"><Link href="/products?category=all" className={categoryId === "all" ? "active" : ""}>전체 상품<span>{products.length}</span></Link>{selectedGroup && <div>{selectedGroup.items.map((item) => <div key={item.categoryId}><Link className={categoryId === item.categoryId || (categoryId === "205010" && item.categoryId === "2050") ? "active" : ""} href={productsHref(item.categoryId)}>{item.title}<Icon name="chevron" size={12} /></Link>{item.categoryId === "2050" && <Link className={`category-child ${categoryId === "205010" ? "child-active" : ""}`} href={productsHref("205010")}>YM 시리즈</Link>}</div>)}</div>}</nav>
        <div className="filter-title"><h2>필터</h2><button type="button" onClick={reset}>초기화 <span aria-hidden="true">↻</span></button></div>
        <fieldset className="filter-group"><legend>제품 시리즈</legend>{["Y", "X", "P"].map((value) => <label key={value}><input type="checkbox" checked={series.includes(value)} onChange={() => toggle(value, series, setSeries)} /><span>DYNAMIXEL {value}</span><small>{categoryProducts.filter((product) => product.series === value).length}</small></label>)}</fieldset>
        <fieldset className="filter-group"><legend>통신 방식</legend>{["RS-485", "TTL"].map((value) => <label key={value}><input type="checkbox" checked={communication.includes(value)} onChange={() => toggle(value, communication, setCommunication)} /><span>{value}</span></label>)}</fieldset>
        <fieldset className="filter-group"><legend>토크 범위</legend>{[{ value: "all", text: "전체" }, { value: "under10", text: "10 N·m 미만" }, { value: "10to20", text: "10 – 20 N·m" }, { value: "over20", text: "20 N·m 이상" }].map((option) => <label key={option.value}><input type="radio" name="torque" value={option.value} checked={torque === option.value} onChange={() => setTorque(option.value)} /><span>{option.text}</span></label>)}</fieldset>
        <StoreLink className="sidebar-help" href="https://www.robotis.com/service/selection_guide.php" target="_blank" rel="noreferrer"><Icon name="info" size={20} /><strong>어떤 제품이 필요하신가요?</strong><p>나에게 맞는 다이나믹셀을<br />선택가이드에서 찾아보세요.</p><span>선택가이드 보기 <Icon name="arrow" size={14} /></span></StoreLink>
      </aside>
      <section className="catalog-content" aria-labelledby="catalog-heading">
        <div className="catalog-intro"><span className="section-eyebrow">ROBOTIS / MOTION SOLUTIONS</span><h1 id="catalog-heading">{categoryName}<span>{categoryProducts.length}</span></h1><p>{categoryId.startsWith("205") ? "정밀한 제어, 강력한 성능. 차세대 로봇을 위한 프리미엄 액추에이터." : "당신의 아이디어를 현실로 만드는 ROBOTIS의 로봇 기술을 만나보세요."}</p><div className="catalog-collection-tag">{categoryId.startsWith("205") ? "DYNAMIXEL-Y SERIES" : "ROBOTIS COLLECTION"}<span>ENGINEERED FOR POSSIBILITY</span></div></div>
        <div className="catalog-toolbar"><div className="toolbar-result"><button type="button" className="mobile-filter-button" aria-expanded={filterOpen} onClick={() => setFilterOpen(!filterOpen)}><Icon name="filter" size={16} />필터{count > 0 && ` ${count}`}</button><span>전체 <strong data-testid="product-count">{filtered.length}</strong>개 상품</span></div><div className="toolbar-right"><label className="sort-label"><span className="sr-only">상품 정렬</span><select aria-label="상품 정렬" value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="recommended">추천순</option><option value="price-asc">낮은 가격순</option><option value="price-desc">높은 가격순</option><option value="name">상품명순</option></select></label><div className="view-toggle"><button aria-label="그리드 보기" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Icon name="grid" size={15} /></button><button aria-label="리스트 보기" aria-pressed={view === "list"} onClick={() => setView("list")}><Icon name="list" size={17} /></button></div></div></div>
        {(count > 0 || keyword) && <div className="active-filters">{series.map((value) => <button key={value} onClick={() => toggle(value, series, setSeries)}>DYNAMIXEL {value}<Icon name="close" size={11} /></button>)}{communication.map((value) => <button key={value} onClick={() => toggle(value, communication, setCommunication)}>{value}<Icon name="close" size={11} /></button>)}{torque !== "all" && <button onClick={() => setTorque("all")}>토크 조건<Icon name="close" size={11} /></button>}{keyword && <button onClick={() => setKeyword("")}>검색: {keyword}<Icon name="close" size={11} /></button>}</div>}
        <div className={`catalog-grid ${view === "list" ? "list-view" : ""}`} data-testid="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        {filtered.length === 0 && <div className="empty-products"><Icon name="search" size={30} /><h2>조건에 맞는 상품이 없습니다.</h2><p>필터를 변경하거나 다른 카테고리를 선택해 주세요.</p><button type="button" onClick={reset}>필터 초기화</button></div>}
        <div className="catalog-bottom"><span>{filtered.length}개 상품을 모두 확인했습니다.</span><a href="#catalog-heading">맨 위로 ↑</a></div>
      </section>
    </div>
  </main>;
}
