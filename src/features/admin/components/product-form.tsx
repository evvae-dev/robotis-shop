"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { formatPrice } from "@/lib/format";
import { isSupportedImageUrl } from "@/lib/image-url";
import type { NavigationGroup } from "@/lib/shop-types";
import { saveProduct } from "../actions";
import type { AdminProduct } from "../lib/admin-types";
import type { ProductInput } from "../lib/schemas";
import { notifyStoreUpdate } from "../lib/notify-store";
import { ModelUploader } from "./model-uploader";

const basics = ["상품코드", "제조사", "원산지", "준비기간"];
const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

export function ProductForm({ initialProduct, navigation, maxCadUploadMb }: { initialProduct?: AdminProduct; navigation: NavigationGroup[]; maxCadUploadMb: number }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>(() => initialProduct ? {
    ...initialProduct, series: initialProduct.series as ProductInput["series"], communication: initialProduct.communication as ProductInput["communication"],
    specifications: initialProduct.specifications.filter((row) => !basics.includes(row.label)),
    modelId: initialProduct.model3d?.id ?? null,
  } : { id: "", name: "", summary: "", price: null, imageUrl: "", gallery: [], detailImages: [], categoryIds: ["2050"], categoryName: "다이나믹셀", series: "Y", communication: "RS-485", torqueNm: null, voltageV: null, speedRpm: null, leadTime: "", manufacturer: "(주)로보티즈", countryOfOrigin: "한국", description: [], specifications: [], resources: [], published: true, modelId: null });
  const [model, setModel] = useState(initialProduct?.model3d ?? null);
  const [converting, setConverting] = useState(false);
  const [galleryText, setGalleryText] = useState(initialProduct?.gallery.filter((url) => url !== initialProduct.imageUrl).join("\n") || "");
  const [detailImagesText, setDetailImagesText] = useState(initialProduct?.detailImages.join("\n") || "");
  const [descriptionText, setDescriptionText] = useState(initialProduct?.description.join("\n") || "");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  function update<K extends keyof ProductInput>(field: K, value: ProductInput[K]) { setForm((current) => ({ ...current, [field]: value })); setFeedback(null); }
  const number = (value: string) => value === "" ? null : Number(value);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (converting || pending) return; setPending(true);
    try {
      const result = await saveProduct({ ...form, gallery: lines(galleryText), detailImages: lines(detailImagesText), description: lines(descriptionText), specifications: form.specifications.filter((row) => row.label.trim() || row.value.trim()), resources: form.resources.filter((row) => row.title.trim() || row.url.trim()) }, initialProduct ? "update" : "create");
      setFeedback(result);
      if (result.ok) { notifyStoreUpdate(); if (!initialProduct) router.replace(`/admin/products/${result.id}`); router.refresh(); }
    } catch { setFeedback({ ok: false, message: "상품 저장에 실패했습니다. 다시 시도해 주세요." }); }
    finally { setPending(false); }
  }

  return <form onSubmit={submit}>
    <div className="admin-page-heading"><div><span>PRODUCT {initialProduct ? "DETAIL" : "REGISTRATION"}</span><h1>{initialProduct ? "상품 상세" : "상품 등록"}</h1><p>{initialProduct ? "상품 정보를 수정하고 스토어에 반영합니다." : "새 상품을 등록한 뒤 메인 구좌에도 배치할 수 있습니다."}</p></div><div className="admin-heading-actions"><Link className="admin-button secondary" href="/admin/products">목록으로</Link><button className="admin-button primary" type="submit" disabled={pending || converting}><Icon name="check" size={16} />{pending ? "저장 중…" : initialProduct?.deleted ? "복구 및 저장" : initialProduct ? "상품 저장" : "상품 등록 저장"}</button></div></div>
    {feedback && <p role={feedback.ok ? "status" : "alert"} className={`admin-feedback ${feedback.ok ? "success" : "error"}`}>{feedback.message}</p>}
    {initialProduct?.deleted && <p className="admin-feedback error">삭제된 상품입니다. 저장하면 복구되며, 노출 상태에 따라 스토어에 표시됩니다.</p>}
    <div className="admin-product-form-layout"><div className="admin-product-form-main">
      <ModelUploader model={model} maxUploadMb={maxCadUploadMb} onBusyChange={setConverting} onChange={(next) => { setModel(next); update("modelId", next?.id ?? null); }} />
      <section className="admin-card admin-form-card"><div className="admin-card-title"><h2>기본 정보</h2><span>필수 정보</span></div><div className="admin-form-grid">
        <label className="admin-field"><span>상품 ID <b>*</b></span><input aria-label="상품 ID" required pattern={"[a-zA-Z0-9_\\-]{1,80}"} maxLength={80} readOnly={!!initialProduct} placeholder="예: 902-0209-000" value={form.id} onChange={(event) => update("id", event.target.value)} /><small>{initialProduct ? "등록된 상품 ID는 변경할 수 없습니다." : "영문·숫자·하이픈·밑줄을 사용할 수 있습니다."}</small></label>
        <label className="admin-field"><span>상품명 <b>*</b></span><input aria-label="상품명" required maxLength={160} value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
        <label className="admin-field">카테고리<select aria-label="상품 카테고리" value={form.categoryIds[0] || ""} onChange={(event) => { const value = event.target.value; const group = navigation.find((item) => item.items.some((child) => child.categoryId === value)); update("categoryIds", [value]); update("categoryName", group?.title || ""); }}>{navigation.map((group) => <optgroup key={group.id} label={group.title}>{group.items.map((item) => <option key={item.categoryId} value={item.categoryId}>{item.title}</option>)}</optgroup>)}</select></label>
        <label className="admin-field">판매가 (원)<input aria-label="판매가" type="number" min={0} max={1e11} step={1} placeholder="미입력 시 견적 문의" value={form.price ?? ""} onChange={(event) => update("price", number(event.target.value))} /></label>
        <label className="admin-field full-width">상품 요약<textarea aria-label="상품 요약" rows={2} maxLength={1000} value={form.summary} onChange={(event) => update("summary", event.target.value)} /></label>
        <label className="admin-field">제조사<input aria-label="제조사" maxLength={100} value={form.manufacturer} onChange={(event) => update("manufacturer", event.target.value)} /></label>
        <label className="admin-field">원산지<input aria-label="원산지" maxLength={80} value={form.countryOfOrigin} onChange={(event) => update("countryOfOrigin", event.target.value)} /></label>
      </div></section>
      <section className="admin-card admin-form-card"><div className="admin-card-title"><h2>상품 이미지</h2><span>이미지 URL 등록</span></div><div className="admin-form-grid"><label className="admin-field full-width"><span>대표 이미지 URL <b>*</b></span><input aria-label="대표 이미지 URL" required value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder="/media/이미지.png 또는 HTTPS 이미지 주소" /><small>/media/ 경로 또는 ROBOTIS·Firebase Storage의 이미지 주소를 입력하세요.</small></label><label className="admin-field full-width">추가 갤러리 이미지<textarea aria-label="추가 갤러리 이미지" rows={3} placeholder="한 줄에 이미지 주소 하나씩 입력하세요." value={galleryText} onChange={(event) => setGalleryText(event.target.value)} /></label><label className="admin-field full-width">공식 상세 이미지<textarea aria-label="공식 상세 이미지" rows={3} value={detailImagesText} onChange={(event) => setDetailImagesText(event.target.value)} /></label></div></section>
      <section className="admin-card admin-form-card"><div className="admin-card-title"><h2>제품 사양</h2><span>선택 정보</span></div><div className="admin-form-grid"><label className="admin-field">시리즈<select aria-label="제품 시리즈" value={form.series} onChange={(event) => update("series", event.target.value as ProductInput["series"])}><option value="">해당 없음</option><option value="Y">DYNAMIXEL Y</option><option value="X">DYNAMIXEL X</option><option value="P">DYNAMIXEL P</option></select></label><label className="admin-field">통신 방식<select aria-label="통신 방식" value={form.communication} onChange={(event) => update("communication", event.target.value as ProductInput["communication"])}><option value="">해당 없음</option><option value="RS-485">RS-485</option><option value="TTL">TTL</option></select></label><label className="admin-field">토크 (N·m)<input aria-label="토크" type="number" min={0} step="any" value={form.torqueNm ?? ""} onChange={(event) => update("torqueNm", number(event.target.value))} /></label><label className="admin-field">입력 전압 (V)<input aria-label="입력 전압" type="number" min={0} step="any" value={form.voltageV ?? ""} onChange={(event) => update("voltageV", number(event.target.value))} /></label><label className="admin-field">회전 속도 (rpm)<input aria-label="회전 속도" type="number" min={0} step="any" value={form.speedRpm ?? ""} onChange={(event) => update("speedRpm", number(event.target.value))} /></label><label className="admin-field">준비기간<input aria-label="준비기간" maxLength={100} placeholder="예: 56일 (휴일미포함)" value={form.leadTime} onChange={(event) => update("leadTime", event.target.value)} /></label></div><div className="admin-repeat-heading"><h3>추가 사양</h3><button type="button" className="admin-text-button" onClick={() => update("specifications", [...form.specifications, { label: "", value: "" }])}><Icon name="plus" size={13} />항목 추가</button></div>{form.specifications.map((row, index) => <div key={index} className="admin-pair-row"><input aria-label={`사양 ${index + 1} 항목`} placeholder="항목명" value={row.label} onChange={(event) => update("specifications", form.specifications.map((item, rowIndex) => rowIndex === index ? { ...item, label: event.target.value } : item))} /><input aria-label={`사양 ${index + 1} 값`} placeholder="값" value={row.value} onChange={(event) => update("specifications", form.specifications.map((item, rowIndex) => rowIndex === index ? { ...item, value: event.target.value } : item))} /><button type="button" aria-label={`사양 ${index + 1} 삭제`} onClick={() => update("specifications", form.specifications.filter((_, rowIndex) => rowIndex !== index))}><Icon name="close" size={14} /></button></div>)}</section>
      <section className="admin-card admin-form-card"><div className="admin-card-title"><h2>상품 설명 및 자료</h2></div><label className="admin-field">상품 설명 · 구매 안내<textarea aria-label="상품 설명" rows={5} placeholder="한 줄에 한 문단씩 입력하세요." value={descriptionText} onChange={(event) => setDescriptionText(event.target.value)} /></label><div className="admin-repeat-heading"><h3>관련 자료 링크</h3><button type="button" className="admin-text-button" onClick={() => update("resources", [...form.resources, { title: "", url: "" }])}><Icon name="plus" size={13} />링크 추가</button></div>{form.resources.map((row, index) => <div key={index} className="admin-pair-row"><input aria-label={`자료 ${index + 1} 제목`} placeholder="자료 제목" value={row.title} onChange={(event) => update("resources", form.resources.map((item, rowIndex) => rowIndex === index ? { ...item, title: event.target.value } : item))} /><input aria-label={`자료 ${index + 1} URL`} placeholder="https://..." value={row.url} onChange={(event) => update("resources", form.resources.map((item, rowIndex) => rowIndex === index ? { ...item, url: event.target.value } : item))} /><button type="button" aria-label={`자료 ${index + 1} 삭제`} onClick={() => update("resources", form.resources.filter((_, rowIndex) => rowIndex !== index))}><Icon name="close" size={14} /></button></div>)}</section>
    </div><aside className="admin-product-form-side"><section className="admin-card admin-form-card"><div className="admin-card-title"><h2>스토어 노출</h2><span className={`admin-grid-status ${form.published ? "published" : "hidden"}`}>{form.published ? "노출" : "미노출"}</span></div><label className="admin-publish-control"><input type="checkbox" aria-label="스토어에 상품 노출" checked={form.published} onChange={(event) => update("published", event.target.checked)} /><div><strong>스토어에 상품 노출</strong><small>저장 후 목록과 상세에 반영됩니다.</small></div></label>{initialProduct && !initialProduct.deleted && form.published && <Link className="admin-product-view-link" href={`/products/${initialProduct.id}`} target="_blank">사이트에서 보기<Icon name="external" size={13} /></Link>}</section><section className="admin-card admin-preview-card"><div className="admin-card-title"><h2>상품 미리보기</h2></div><div className="admin-preview-image">{isSupportedImageUrl(form.imageUrl) ? <Image src={form.imageUrl} alt="상품 미리보기" fill sizes="280px" /> : <Icon name="box" size={50} />}</div><div className="admin-preview-info"><small>{form.id || "PRODUCT ID"}</small><h3>{form.name || "상품명을 입력하세요"}</h3><p>{form.summary || "상품 요약이 표시됩니다."}</p><strong>{formatPrice(form.price)}</strong></div></section></aside></div>
  </form>;
}
