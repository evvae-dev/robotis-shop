"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useCartStore } from "@/features/cart/store/cart-store";
import { formatPrice } from "@/lib/format";
import type { Product } from "../types/product";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const toggleWish = useCartStore((state) => state.toggleWish);
  const wished = useCartStore((state) => state.wishes.includes(product.id));

  return <article className={`product-card ${compact ? "compact-card" : ""}`} data-product-id={product.id}>
    <div className="product-image-wrap">
      <Link href={`/products/${product.id}`} aria-label={`${product.name} 상세보기`} className="product-image-link"><Image src={product.imageUrl} alt={product.name} fill sizes={compact ? "(max-width: 640px) 45vw, 220px" : "(max-width: 640px) 45vw, (max-width: 1024px) 35vw, 300px"} className="product-image" /></Link>
      {!compact && <><span className="product-series-badge">{product.series ? `DYNAMIXEL ${product.series}` : product.categoryName}</span><button type="button" className={`wish-button ${wished ? "is-wished" : ""}`} aria-label={`${product.name} 관심상품`} aria-pressed={wished} onClick={() => toggleWish(product.id)}><Icon name="heart" size={18} /></button></>}
    </div>
    <div className="product-card-info">
      {!compact && <p className="product-code">{product.id}</p>}
      <Link className="product-name" href={`/products/${product.id}`}>{product.name}</Link>
      {!compact && <><p className="product-summary">{product.summary}</p><div className="spec-chips">{product.torqueNm !== null && <span>{product.torqueNm} N·m</span>}{product.communication && <span>{product.communication}</span>}{product.voltageV !== null && <span>{product.voltageV} V</span>}</div></>}
      <div className="product-price-row"><strong>{formatPrice(product.price)}</strong>{!compact && product.price !== null && <span>VAT 포함</span>}</div>
      {!compact && <div className="product-card-bottom"><span className="product-lead"><span />{product.leadTime ? `준비기간 ${product.leadTime.replace(/\s*\(.*\)/, "")}` : "배송 일정 확인"}</span><button type="button" onClick={() => { addItem(product.id); setAdded(true); }} aria-label={`${product.name} 장바구니 담기`} className={added ? "card-cart added" : "card-cart"}><Icon name={added ? "check" : "cart"} size={17} /><span>{added ? "담음" : "담기"}</span></button></div>}
      {added && <span className="sr-only" role="status">{product.name}을 장바구니에 담았습니다.</span>}
    </div>
  </article>;
}
