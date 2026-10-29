"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreLink } from "@/components/ui/store-link";
import { Icon } from "@/components/ui/icon";
import { useCartStore } from "@/features/cart/store/cart-store";
import { formatPrice } from "@/lib/format";
import type { Product } from "../types/product";
import { ProductCard } from "./product-card";
import { ProductModelViewer } from "./ym080-viewer";

type DetailTab = "viewer" | "information" | "shipping" | "returns";
export function ProductDetail({ product, related, shipping, returns }: { product: Product; related: Product[]; shipping: string[]; returns: string[] }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<DetailTab>(product.model3d || product.id === "902-0209-000" ? "viewer" : "information");
  const [notice, setNotice] = useState("");
  const addItem = useCartStore((state) => state.addItem);
  const toggleWish = useCartStore((state) => state.toggleWish);
  const wished = useCartStore((state) => state.wishes.includes(product.id));
  const isHand = product.id === "905-0058-000";
  const hasThreeViewer = !!product.model3d || product.id === "902-0209-000";
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) setTab(visible.target.getAttribute("data-product-section") as DetailTab);
    }, { rootMargin: "-100px 0px -55% 0px" });
    document.querySelectorAll("[data-product-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [product.id]);
  const highlights = [
    ...(isHand ? [{ value: "20 DoF", label: "자유도" }, { value: "오른손", label: "모델 타입" }] : []),
    ...(product.torqueNm !== null ? [{ value: `${product.torqueNm} N·m`, label: "토크" }] : []),
    ...(product.voltageV !== null ? [{ value: `${product.voltageV} V`, label: "입력 전압" }] : []),
    ...(product.communication ? [{ value: product.communication, label: "통신 방식" }] : []),
    { value: product.countryOfOrigin || "ROBOTIS", label: "원산지" },
  ].slice(0, 4);

  return <main id="main" className="shop-width detail-page">
    <div className="breadcrumbs"><Link href="/" aria-label="스토어 홈"><Icon name="home" size={13} /></Link><Icon name="chevron" size={11} /><Link href="/products?category=all">{product.categoryName || "상품"}</Link><Icon name="chevron" size={11} /><strong>{product.name}</strong></div>
    <div className="product-detail-top">
      <section className="detail-gallery" aria-label="상품 이미지 갤러리"><div className="detail-main-image"><span className="gallery-label">ROBOTIS ORIGINAL</span><Image key={imageIndex} src={product.gallery[imageIndex] || product.imageUrl} alt={`${product.name} 제품 이미지 ${imageIndex + 1}`} fill priority sizes="(max-width: 768px) 90vw, 600px" className="detail-product-image" /><span className="gallery-count">{String(imageIndex + 1).padStart(2, "0")} / {String(product.gallery.length).padStart(2, "0")}</span></div><div className="gallery-thumbnails">{product.gallery.map((image, index) => <button key={image} type="button" onClick={() => setImageIndex(index)} className={imageIndex === index ? "selected" : ""} aria-label={`상품 이미지 ${index + 1} 보기`} aria-pressed={imageIndex === index}><Image src={image} alt="" fill sizes="75px" /></button>)}<span>다양한 각도에서 제품을 확인하세요.</span></div></section>
      <section className="detail-purchase" aria-labelledby="product-heading"><div className="detail-brand-line"><span>{isHand ? "ROBOT HAND · HX SERIES" : product.series ? `DYNAMIXEL ${product.series} SERIES` : "ROBOTIS ORIGINAL"}</span><button type="button" aria-label="관심상품 등록" aria-pressed={wished} onClick={() => toggleWish(product.id)} className={wished ? "is-wished" : ""}><Icon name="heart" size={20} /></button></div><h1 id="product-heading">{product.name}</h1><p className="detail-subtitle">{product.summary}</p><div className="detail-price"><strong>{formatPrice(product.price)}</strong>{product.price !== null && <span>VAT 포함</span>}</div>
        <dl className="purchase-facts"><div><dt>상품코드</dt><dd>{product.id}</dd></div><div><dt>제조사 / 원산지</dt><dd>{product.manufacturer} <span>/</span> {product.countryOfOrigin}</dd></div><div><dt>배송비</dt><dd>{product.price !== null && product.price >= 50000 ? "무료배송" : "주문 시 확인"}<small>일부 도서·산간 지역 별도</small></dd></div></dl>
        {product.leadTime && <div className="lead-time-notice"><Icon name="box" size={18} /><p><strong>준비기간 {product.leadTime}</strong><span>제품 준비 후 순차적으로 발송됩니다.</span></p><Icon name="info" size={15} /></div>}
        <div className="quantity-line"><span>구매 수량</span><div className="quantity-control"><button type="button" aria-label="수량 줄이기" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}><Icon name="minus" size={13} /></button><input aria-label="구매 수량" type="number" min={1} max={999} value={quantity} onChange={(event) => setQuantity(Math.min(999, Math.max(1, Math.floor(Number(event.target.value) || 1))))} /><button type="button" aria-label="수량 늘리기" disabled={quantity >= 999} onClick={() => setQuantity(quantity + 1)}><Icon name="plus" size={13} /></button></div></div>
        <div className="purchase-total"><span>총 상품금액<small>({quantity}개)</small></span><strong data-testid="total-price">{formatPrice(product.price === null ? null : product.price * quantity)}</strong></div>
        <div className="purchase-buttons"><button type="button" className="add-to-cart-button" onClick={() => { addItem(product.id, quantity); setNotice(`${product.name} ${quantity}개를 장바구니에 담았습니다.`); }}><Icon name="cart" size={19} /> 장바구니 담기</button><button type="button" onClick={() => setNotice(`${product.name} ${quantity}개가 문의 대상으로 선택되었습니다. 포트폴리오의 모의 문의 기능입니다.`)}>제품 문의하기 <Icon name="arrow" size={17} /></button></div>
        {notice && <p className="purchase-notice" role="status"><Icon name="check" size={15} />{notice}</p>}
        <p className="purchase-caption">본 사이트는 포트폴리오로 실제 주문·결제는 진행되지 않습니다.</p>
      </section>
    </div>
    <nav className="detail-tabs" aria-label="상품 상세 안내">{[...(hasThreeViewer ? [{ id: "viewer", label: "3D 뷰어" }] : []), { id: "information", label: "상품 상세정보" }, { id: "shipping", label: "배송 안내" }, { id: "returns", label: "교환 및 반품" }].map((item) => <a key={item.id} className="detail-section-tab" id={`tab-${item.id}`} href={`#panel-${item.id}`} aria-current={tab === item.id ? "location" : undefined} onClick={() => setTab(item.id as DetailTab)}>{item.label}</a>)}<a className="detail-product-jump" href="#product-heading">{product.name}<Icon name="arrow" size={14} /></a></nav>
    {hasThreeViewer && <section id="panel-viewer" data-product-section="viewer" aria-labelledby="tab-viewer" className="detail-tab-panel product-detail-section"><ProductModelViewer product={product} /></section>}
    <section id="panel-information" data-product-section="information" aria-labelledby="tab-information" className="detail-tab-panel product-detail-section">
        <div className="detail-section-heading"><span className="section-eyebrow">PRODUCT OVERVIEW</span><h2>{isHand ? "로봇의 가능성, 손끝에서 시작됩니다." : "정교한 기술. 새로운 움직임."}</h2><p>{product.summary}</p></div>
        <div className="detail-overview-banner"><div><span>ROBOTIS / {isHand ? "DEXTEROUS HAND" : "INTELLIGENT MOTION"}</span><h3>{product.name}</h3><p>{product.summary}</p><a href="#technical-specifications">제품 사양 확인 <Icon name="arrow" size={16} /></a></div><div className="overview-product-image"><Image src={product.imageUrl} alt="" fill sizes="400px" /></div></div>
        <div className="detail-highlights">{highlights.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        <div className="technical-layout" id="technical-specifications"><div className="technical-intro"><span className="section-eyebrow">TECHNICAL INFORMATION</span><h2>제품 사양</h2><p>제품 선택에 필요한 정보를<br />한눈에 확인하세요.</p></div><dl className="specification-table">{product.specifications.map((specification) => <div key={specification.label}><dt>{specification.label}</dt><dd>{specification.value}</dd></div>)}{product.torqueNm !== null && <div><dt>토크</dt><dd>{product.torqueNm} N·m</dd></div>}{product.voltageV !== null && <div><dt>입력 전압</dt><dd>{product.voltageV} V</dd></div>}{product.speedRpm !== null && <div><dt>회전 속도</dt><dd>{product.speedRpm} rpm</dd></div>}{product.communication && <div><dt>통신 방식</dt><dd>{product.communication}</dd></div>}</dl></div>
        {product.resources.length > 0 && <section className="resources-section" aria-labelledby="resources-heading"><div className="resources-heading"><span className="section-eyebrow">DEVELOPER RESOURCES</span><h2 id="resources-heading">개발에 필요한 모든 자료</h2><p>설치부터 개발까지, 공식 문서와 함께 시작하세요.</p></div><div className="resource-grid">{product.resources.filter((resource) => /^https:\/\//.test(resource.url)).map((resource, index) => <StoreLink key={resource.url} href={resource.url} target="_blank" rel="noreferrer"><span className="resource-number">0{index + 1}</span><strong>{resource.title.replace("Github 로스패키지", "GitHub · ROS 패키지")}</strong><Icon name="external" size={17} /></StoreLink>)}</div></section>}
        {product.description.length > 0 && <aside className="product-notes"><Icon name="info" size={20} /><div><h3>구매 전 확인해 주세요</h3>{product.description.map((paragraph) => <p key={paragraph}>{paragraph.replace(/^\*/, "")}</p>)}</div></aside>}
        {product.detailImages.length > 0 && <details className="original-description"><summary>공식 제품 상세 자료 보기<Icon name="plus" size={18} /></summary><div>{product.detailImages.map((image, index) => <img key={image} src={image} alt={`${product.name} 공식 상세 자료 ${index + 1}`} loading="lazy" />)}</div></details>}
    </section>
    {([{ id: "shipping", title: "배송 안내", paragraphs: shipping }, { id: "returns", title: "교환 및 반품 안내", paragraphs: returns }] as const).map((section) => <section key={section.id} id={`panel-${section.id}`} data-product-section={section.id} aria-labelledby={`tab-${section.id}`} className="detail-tab-panel product-detail-section"><div className="policy-panel"><span className="section-eyebrow">CUSTOMER INFORMATION</span><h2>{section.title}</h2><p className="policy-caption">원본 ROBOTIS 스토어에 안내된 내용입니다. 실제 구매 시 공식 스토어의 최신 안내를 확인해 주세요.</p>{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section>)}
    {related.length > 0 && <section className="related-products" aria-labelledby="related-heading"><div className="home-section-heading"><div><h2 id="related-heading">함께 살펴보면 좋은 상품</h2><p>ROBOTIS COLLECTION</p></div><Link href="/products?category=all">전체보기 <Icon name="arrow" size={15} /></Link></div><div className="related-product-grid">{related.map((item) => <ProductCard key={item.id} product={item} compact />)}</div></section>}
  </main>;
}
