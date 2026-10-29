import type { Product } from "@/features/products/types/product";

export type AdminProduct = Product & { deleted: boolean };
export type AdminResult = { ok: true; message: string; id?: string } | { ok: false; message: string };
