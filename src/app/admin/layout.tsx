import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getSiteContent } from "@/lib/shop-data";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "관리자", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  return <AdminShell logoUrl={content.logoUrl}>{children}</AdminShell>;
}
