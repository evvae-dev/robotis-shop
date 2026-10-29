import { notFound } from "next/navigation";
import { ProductForm } from "@/features/admin/components/product-form";
import { getAdminProduct } from "@/features/admin/lib/admin-data";
import { getSiteContent } from "@/lib/shop-data";

export default async function AdminProductPage({ params }: { params: { productId: string } }) {
  const [product, content] = await Promise.all([getAdminProduct(params.productId), getSiteContent()]);
  if (!product) notFound();
  return <ProductForm key={product.id} initialProduct={product} navigation={content.navigation} />;
}
