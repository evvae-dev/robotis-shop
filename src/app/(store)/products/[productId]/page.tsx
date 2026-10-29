import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/features/products/components/product-detail";
import { getProduct, getProducts, getSiteContent } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { productId: string } }): Promise<Metadata> {
  const product = await getProduct(params.productId);
  return { title: product?.name || "상품을 찾을 수 없습니다", description: product?.summary };
}

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const [product, products, content] = await Promise.all([getProduct(params.productId), getProducts(), getSiteContent()]);
  if (!product) notFound();
  const related = products.filter((item) => item.id !== product.id).sort((a, b) => Number(b.categoryName === product.categoryName) - Number(a.categoryName === product.categoryName)).slice(0, 4);
  return <ProductDetail key={product.id} product={product} related={related} shipping={content.shipping || []} returns={content.returns || []} />;
}
