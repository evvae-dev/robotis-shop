"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreLink } from "@/components/ui/store-link";
import { Icon } from "@/components/ui/icon";
import { productsHref } from "@/lib/format";
import type { Banner, NavigationGroup } from "@/lib/shop-types";

function bannerHref(banner: Banner) {
  if (banner.productId) return `/products/${banner.productId}`;
  if (banner.categoryId) return productsHref(banner.categoryId);
  return banner.sourceLink;
}

export function HomeHero({ banners, navigation }: { banners: Banner[]; navigation: NavigationGroup[] }) {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    // 모션 축소 환경과 숨겨진 탭에서는 자동 전환하지 않습니다.
    if (paused || banners.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setSelected((value) => (value + 1) % banners.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, banners.length]);
  const current = banners[selected];
  if (!current) return null;

  return <section className="home-hero-section" aria-label="ROBOTIS 주요 상품 배너">
    <div className="shop-width hero-shell">
      <aside className="home-category-panel" aria-label="메인 상품 카테고리"><nav className="home-category-groups" aria-label="메인 카테고리 목록">{navigation.map((group) => <div key={group.id} className="home-category-group"><h2>{group.title}</h2>{group.items.map((item) => <Link key={item.categoryId} href={productsHref(item.categoryId)}>{item.title}</Link>)}</div>)}</nav><StoreLink className="home-support-link" href="https://www.robotis.com/model/board.php?bo_table=qna" target="_blank" rel="noreferrer"><span>1:1 구매문의</span><Icon name="external" size={13} /></StoreLink></aside>
      <div className="hero-stage"><StoreLink href={bannerHref(current)} aria-label={`${current.title} 살펴보기`}><picture>{current.mobileImageUrl && <source media="(max-width: 480px)" srcSet={current.mobileImageUrl} />}<Image src={current.imageUrl} alt={current.title} fill priority sizes="(max-width: 1300px) 100vw, 1240px" className="hero-banner-image" /></picture></StoreLink>
        <div className="hero-controls"><button type="button" aria-label="이전 배너" onClick={() => { setSelected((selected + banners.length - 1) % banners.length); setPaused(true); }}><Icon name="chevron" size={15} className="rotate-180" /></button><span>{String(selected + 1).padStart(2, "0")}<i>/</i>{String(banners.length).padStart(2, "0")}</span><button type="button" aria-label="다음 배너" onClick={() => { setSelected((selected + 1) % banners.length); setPaused(true); }}><Icon name="chevron" size={15} /></button><button type="button" aria-label="배너 자동 재생 일시정지" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "▷" : "Ⅱ"}</button></div>
      </div>
      <div className="hero-tabs" role="group" aria-label="배너 선택">{banners.map((banner, index) => <button type="button" key={banner.id} onClick={() => { setSelected(index); setPaused(true); }} className={index === selected ? "selected" : ""} aria-pressed={index === selected}><span className="hero-tab-thumb"><Image src={banner.thumbnailUrl} alt="" fill sizes="65px" /></span><span>{banner.title}</span></button>)}</div>
    </div>
  </section>;
}
