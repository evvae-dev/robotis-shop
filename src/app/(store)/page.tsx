import Link from "next/link";
import { HomeHero } from "@/features/landing/components/home-hero";
import { ProductCard } from "@/features/products/components/product-card";
import { Icon } from "@/components/ui/icon";
import { getBanners, getProducts, getSiteContent } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, products, banners] = await Promise.all([getSiteContent(), getProducts(), getBanners()]);
  const byId = new Map(products.map((product) => [product.id, product]));

  return <main id="main">
    <h1 className="sr-only">ROBOTIS 온라인 스토어</h1>
    <HomeHero banners={banners} navigation={content.navigation} />
    <div className="shop-width home-products">{content.homeSections.map((section) => <section key={section.id} className="home-product-section" aria-labelledby={`section-${section.id}`}>
      <div className="home-section-heading"><div><h2 id={`section-${section.id}`}>{section.title}</h2><p>{section.subtitle}</p></div><Link href="/products?category=all">전체보기 <Icon name="plus" size={15} /></Link></div>
      <div className="home-product-grid">{section.productIds.map((id) => byId.get(id)).filter((product) => product !== undefined).slice(0, section.productCount).map((product) => <ProductCard key={product.id} product={product} compact />)}</div>
    </section>)}</div>
    <div className="home-service-strip shop-width"><div><Icon name="truck" size={26} /><p><strong>전국 배송</strong><span>5만원 이상 구매 시 무료배송</span></p></div><div><Icon name="box" size={26} /><p><strong>ROBOTIS 공식 제품</strong><span>믿을 수 있는 로봇 기술과 품질</span></p></div><a href="https://docs.robotis.com/" target="_blank" rel="noreferrer"><Icon name="download" size={26} /><p><strong>개발자 지원</strong><span>매뉴얼·도면·오픈소스 자료</span></p><Icon name="external" size={15} /></a></div>
  </main>;
}
