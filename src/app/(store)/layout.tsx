import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StoreUpdates } from "@/components/layout/store-updates";
import { getSiteContent } from "@/lib/shop-data";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  return <><a href="#main" className="skip-link">본문으로 건너뛰기</a><SiteHeader content={content} /><StoreUpdates />{children}<SiteFooter /></>;
}
