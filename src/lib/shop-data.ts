import "server-only";

import { cache } from "react";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Product } from "@/features/products/types/product";
import type { Banner, HomeSection, SiteContent } from "@/lib/shop-types";

/** 같은 요청 안의 레이아웃·페이지 조회를 합칩니다. 요청 간 영구 캐시는 사용하지 않습니다. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const snapshot = await getAdminDb().collection("siteContent").doc("home").get();
  if (!snapshot.exists) throw new Error("스토어 설정이 없습니다. npm run data:import를 먼저 실행하세요.");
  const data = snapshot.data()!;
  if (!data.logoUrl || !Array.isArray(data.navigation) || !Array.isArray(data.homeSections)) {
    throw new Error("Firestore 스토어 설정의 형식이 올바르지 않습니다.");
  }
  return { logoUrl: data.logoUrl, navigation: data.navigation, homeSections: data.homeSections.map((section: HomeSection) => ({ ...section, productCount: section.productCount ?? section.productIds.length })), shipping: data.shipping ?? [], returns: data.returns ?? [] };
});

// SDK Timestamp를 Client Component에 넘기지 않고 화면에 필요한 필드만 직렬화합니다.
export function toProduct(id: string, data: FirebaseFirestore.DocumentData): Product {
  if (typeof data.name !== "string" || typeof data.imageUrl !== "string" || !Array.isArray(data.categoryIds)) {
    throw new Error(`상품 데이터 형식 오류: products/${id}`);
  }
  return {
    id, name: data.name, summary: data.summary ?? "", price: data.price ?? null,
    priceLabel: data.priceLabel ?? "", imageUrl: data.imageUrl, gallery: data.gallery ?? [data.imageUrl],
    categoryIds: data.categoryIds, categoryName: data.categoryName ?? "", series: data.series ?? "",
    communication: data.communication ?? "", torqueNm: data.torqueNm ?? null,
    voltageV: data.voltageV ?? null, speedRpm: data.speedRpm ?? null, leadTime: data.leadTime ?? "",
    manufacturer: data.manufacturer ?? "", countryOfOrigin: data.countryOfOrigin ?? "",
    specifications: data.specifications ?? [], description: data.description ?? [],
    detailImages: data.detailImages ?? [], resources: data.resources ?? [], sourceUrl: data.sourceUrl ?? "",
    sourceUpdatedAt: data.sourceUpdatedAt ?? "", published: data.published === true, sortOrder: data.sortOrder ?? 999,
    model3d: data.model3d ?? null,
  };
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const snapshot = await getAdminDb().collection("products").where("published", "==", true).get();
  return snapshot.docs.map((document) => toProduct(document.id, document.data())).sort((a, b) => a.sortOrder - b.sortOrder);
});

export const getProduct = cache(async (id: string): Promise<Product | null> => {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return null;
  const snapshot = await getAdminDb().collection("products").doc(id).get();
  if (!snapshot.exists || snapshot.data()?.published !== true) return null;
  return toProduct(snapshot.id, snapshot.data()!);
});

export const getBanners = cache(async (): Promise<Banner[]> => {
  const snapshot = await getAdminDb().collection("banners").where("published", "==", true).get();
  return snapshot.docs.map((document) => {
    const data = document.data();
    return { id: document.id, title: data.title, imageUrl: data.imageUrl, thumbnailUrl: data.thumbnailUrl,
      mobileImageUrl: data.mobileImageUrl ?? "", sourceLink: data.sourceLink, categoryId: data.categoryId ?? null,
      productId: data.productId ?? null, order: data.order ?? 0 };
  }).sort((a, b) => a.order - b.order);
});
