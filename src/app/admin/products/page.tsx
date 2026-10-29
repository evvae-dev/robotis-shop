import { ProductManager } from "@/features/admin/components/product-manager";
import { getAdminProducts } from "@/features/admin/lib/admin-data";

export default async function ProductManagementPage() {
  return <ProductManager products={await getAdminProducts()} />;
}
