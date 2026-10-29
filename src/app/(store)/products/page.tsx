import type { Metadata } from "next";
import { ProductCatalog } from "@/features/products/components/product-catalog";
import { getProducts, getSiteContent } from "@/lib/shop-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "상품 목록" };

export default async function ProductsPage({ searchParams }: { searchParams: { category?: string; q?: string } }) {
  const [products, content] = await Promise.all([getProducts(), getSiteContent()]);
  const categoryId = searchParams.category || (searchParams.q ? "all" : "2050");
  // 데이터는 Firestore에서 조회하며, 작은 카탈로그의 필터·정렬은 클라이언트에서 즉시 반영합니다.
  return <ProductCatalog key={`${categoryId}:${searchParams.q || ""}`} products={products} navigation={content.navigation} categoryId={categoryId} query={searchParams.q || ""} />;
}
