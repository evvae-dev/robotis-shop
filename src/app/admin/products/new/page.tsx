import { ProductForm } from "@/features/admin/components/product-form";
import { getSiteContent } from "@/lib/shop-data";

export default async function NewProductPage() {
  const content = await getSiteContent();
  return <ProductForm navigation={content.navigation} />;
}
