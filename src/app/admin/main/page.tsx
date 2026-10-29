import { MainManager } from "@/features/admin/components/main-manager";
import { getProducts, getSiteContent } from "@/lib/shop-data";

export default async function MainManagementPage() {
  const [content, products] = await Promise.all([getSiteContent(), getProducts()]);
  return <MainManager initialSections={content.homeSections} products={products} />;
}
