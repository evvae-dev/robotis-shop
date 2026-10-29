"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export function AdminShell({ logoUrl, children }: { logoUrl: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const menu = [{ href: "/admin/main", label: "메인관리", icon: "home" }, { href: "/admin/products", label: "상품관리", icon: "box" }] as const;
  const current = pathname.startsWith("/admin/products") ? "상품관리" : "메인관리";
  return <div className="admin-app">
    <header className="admin-topbar"><Link href="/" aria-label="스토어 홈"><Image src={logoUrl} alt="ROBOTIS shop" width={180} height={57} /></Link><span className="admin-topbar-divider" /><strong>STORE ADMIN</strong><Link href="/" target="_blank" className="admin-store-link">스토어 보기<Icon name="external" size={14} /></Link></header>
    <aside className="admin-sidebar"><div className="admin-sidebar-label">WORKSPACE</div><nav aria-label="관리자 메뉴">{menu.map((item) => <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? "active" : ""}><Icon name={item.icon} size={18} /><span>{item.label}</span><Icon name="chevron" size={13} /></Link>)}</nav><div className="admin-sidebar-bottom"><span className="admin-db-dot" /><div><strong>Firestore</strong><small>robotis-shop</small></div></div></aside>
    <main id="main" className="admin-workspace"><div className="admin-breadcrumb">관리자 페이지<Icon name="chevron" size={11} /><span>{current}</span></div>{children}</main>
  </div>;
}
