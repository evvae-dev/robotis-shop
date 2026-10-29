import { ProductForm } from "@/features/admin/components/product-form";
import { getSiteContent } from "@/lib/shop-data";
import { getCadConfig } from "@/lib/cad-config";

export default async function NewProductPage() {
  const content = await getSiteContent();
  return <ProductForm navigation={content.navigation} maxCadUploadMb={getCadConfig().maxUploadMb} />;
}
