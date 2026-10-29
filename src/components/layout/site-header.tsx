"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StoreLink } from "@/components/ui/store-link";
import { Icon } from "@/components/ui/icon";
import { useCartStore } from "@/features/cart/store/cart-store";
import { productsHref } from "@/lib/format";
import type { SiteContent } from "@/lib/shop-types";

export function SiteHeader({ content }: { content: SiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const quantity = useCartStore((state) => Object.values(state.items).reduce((sum, value) => sum + value, 0));

  return (
    <header className="store-header">
      <div className="utility-bar"><div className="shop-width utility-inner">
        <div className="utility-links"><StoreLink href="https://www.robotis.com/" target="_blank" rel="noreferrer">홈페이지</StoreLink><a href="https://docs.robotis.com/" target="_blank" rel="noreferrer">개발문서</a><StoreLink href="https://www.robotis.com/service/downloadcenter.php" target="_blank" rel="noreferrer"><Icon name="download" size={12} /> 다운로드센터</StoreLink></div>
        <div className="utility-admin-area"><Link href="/admin/main" className="admin-entry-link"><Icon name="grid" size={11} />관리자 페이지</Link><span className="utility-caption">ROBOTIS ONLINE STORE</span></div>
      </div></div>
      <div className="shop-width brand-row">
        <Link href="/" aria-label="ROBOTIS shop 홈"><Image src={content.logoUrl} alt="ROBOTIS shop" width={240} height={75} priority className="store-logo" /></Link>
        <div className="header-right">
          <div className="account-links"><StoreLink href="https://www.robotis.com/model/login.php" target="_blank" rel="noreferrer">로그인</StoreLink><span>│</span><StoreLink href="https://www.robotis.com/model/register_check.php" target="_blank" rel="noreferrer">회원가입</StoreLink><span>│</span><StoreLink href="https://www.robotis.com/shop/orderinquiry.php" target="_blank" rel="noreferrer">주문조회</StoreLink><span>│</span><span>KOREA · KRW</span></div>
          <div className="search-cart-row">
            <form action="/products" className="header-search" role="search"><input name="q" aria-label="상품 검색" placeholder="어떤 로봇을 찾으시나요?" /><button aria-label="검색" type="submit"><Icon name="search" size={20} /></button></form>
            <div className="cart-anchor"><button type="button" className="header-cart" aria-label={`장바구니 ${quantity}개`} aria-expanded={cartOpen} onClick={() => setCartOpen(!cartOpen)}><Icon name="cart" size={23} /><span>{quantity}</span></button>
              {cartOpen && <div className="cart-popover" role="status"><strong>장바구니</strong><p>{quantity ? `${quantity}개의 상품을 담았습니다.` : "장바구니가 비어 있습니다."}</p><small>포트폴리오의 모의 장바구니입니다.</small></div>}
            </div>
          </div>
        </div>
      </div>
      <div className="nav-border"><nav className="shop-width primary-nav" aria-label="주요 카테고리">
        <button className="all-menu" type="button" aria-label="전체 카테고리" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} size={19} /><span>전체 카테고리</span></button>
        <div className="primary-links">{content.navigation.map((group) => <Link key={group.id} href={productsHref(group.items[0]?.categoryId || "all")}>{group.title}</Link>)}<StoreLink href="https://www.robotis.com/model/board.php?bo_table=notice" target="_blank" rel="noreferrer">고객지원</StoreLink></div>
        <Link href="/products?category=all" className="nav-all-products">전체 상품 <Icon name="arrow" size={15} /></Link>
        {menuOpen && <div className="mega-menu">{content.navigation.map((group) => <div key={group.id}><h2>{group.title}</h2>{group.items.map((item) => <Link onClick={() => setMenuOpen(false)} key={item.categoryId} href={productsHref(item.categoryId)}>{item.title}<Icon name="chevron" size={12} /></Link>)}</div>)}</div>}
      </nav></div>
    </header>
  );
}
