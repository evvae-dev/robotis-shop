import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { toProduct } from "@/lib/shop-data";
import type { AdminProduct } from "./admin-types";

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const snapshot = await getAdminDb().collection("products").get();
  return snapshot.docs.map((document) => ({ ...toProduct(document.id, document.data()), deleted: document.data().deleted === true })).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return null;
  const snapshot = await getAdminDb().collection("products").doc(id).get();
  return snapshot.exists ? { ...toProduct(snapshot.id, snapshot.data()!), deleted: snapshot.data()!.deleted === true } : null;
}
