"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { formatPrice } from "@/lib/format";
import type { HomeSection } from "@/lib/shop-types";
import type { Product } from "@/features/products/types/product";
import { saveHomeSections } from "../actions";
import { notifyStoreUpdate } from "../lib/notify-store";

export function MainManager({ initialSections, products }: { initialSections: HomeSection[]; products: Product[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [selectedId, setSelectedId] = useState(initialSections[0]?.id || "");
  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const selected = sections.find((section) => section.id === selectedId);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const available = products.filter((product) => !selected?.productIds.includes(product.id) && `${product.id} ${product.name}`.toLowerCase().includes(search.toLowerCase()));

  function addSection() {
    const section: HomeSection = { id: `section-${crypto.randomUUID()}`, title: "새 구좌", subtitle: "", productCount: 5, productIds: [], order: sections.length };
    setSections((current) => [...current, section]);
    setSelectedId(section.id);
    setFeedback(null);
  }
  function removeSection() {
    const index = sections.findIndex((section) => section.id === selectedId);
    const remaining = sections.filter((section) => section.id !== selectedId).map((section, order) => ({ ...section, order }));
    setSections(remaining);
    setSelectedId(remaining[Math.min(index, remaining.length - 1)]?.id || "");
    setPicker(false);
    setConfirmDelete(false);
    setFeedback(null);
  }

  function updateSection(patch: Partial<HomeSection>) {
    setSections((current) => current.map((section) => section.id === selectedId ? { ...section, ...patch } : section));
    setFeedback(null);
  }
  function moveProduct(index: number, direction: -1 | 1) {
    if (!selected) return;
    const ids = [...selected.productIds];
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    updateSection({ productIds: ids });
  }
  async function save() {
    setPending(true);
    try {
      const result = await saveHomeSections(sections);
      setFeedback(result);
      if (result.ok) { notifyStoreUpdate(); router.refresh(); }
    } catch { setFeedback({ ok: false, message: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }); }
    finally { setPending(false); }
  }

  return <>
    <div className="admin-page-heading"><div><span>HOME CONTENT</span><h1>메인관리</h1><p>스토어 메인의 구좌 구성과 노출 상품을 관리합니다.</p></div><div className="admin-heading-actions"><button type="button" className="admin-button secondary" onClick={addSection} disabled={pending || sections.length >= 20}><Icon name="plus" size={16} />구좌 추가</button><button type="button" className="admin-button primary" onClick={save} disabled={pending}><Icon name="check" size={16} />{pending ? "저장 중…" : "변경사항 저장"}</button></div></div>
    {feedback && <p role={feedback.ok ? "status" : "alert"} className={`admin-feedback ${feedback.ok ? "success" : "error"}`}>{feedback.message}</p>}
    <div className="admin-main-layout"><section className="admin-card section-list-card"><div className="admin-card-title"><h2>메인 구좌</h2><span>{sections.length}개</span></div><div className="admin-section-list">{sections.map((section, index) => <button type="button" key={section.id} className={section.id === selectedId ? "selected" : ""} onClick={() => { setSelectedId(section.id); setFeedback(null); }}><span className="section-order">{String(index + 1).padStart(2, "0")}</span><div><strong>{section.title}</strong><small>등록 {section.productIds.length}개 · 최대 {section.productCount}개 노출</small></div><Icon name="chevron" size={14} /></button>)}</div><div className="admin-card-note"><Icon name="info" size={15} /><p>구좌를 추가·삭제하거나 내용을 수정한 뒤 저장하면 메인에 반영됩니다.</p></div></section>
      {selected ? <section className="admin-card section-editor"><div className="admin-card-title"><div><h2>구좌 설정</h2><p>{selected.title}</p></div><button type="button" className="admin-button danger small" disabled={pending} onClick={() => setConfirmDelete(true)}><Icon name="close" size={14} />구좌 삭제</button></div><div className="admin-form-grid"><label className="admin-field">타이틀<input aria-label="구좌 타이틀" maxLength={80} value={selected.title} onChange={(event) => updateSection({ title: event.target.value })} /></label><label className="admin-field">노출 상품 수<input aria-label="노출 상품 수" type="number" min={0} max={50} value={selected.productCount} onChange={(event) => updateSection({ productCount: Math.min(50, Math.max(0, Math.floor(Number(event.target.value) || 0))) })} /></label><label className="admin-field full-width">서브타이틀<input aria-label="구좌 서브타이틀" maxLength={160} value={selected.subtitle} onChange={(event) => updateSection({ subtitle: event.target.value })} /></label></div>
        <div className="admin-assignment-heading"><div><h3>등록 상품 <span>{selected.productIds.length}</span></h3><p>위에서부터 설정한 노출 수만큼 표시됩니다.</p></div><button type="button" className="admin-button secondary small" onClick={() => { setPicker(true); setPicked([]); setSearch(""); }}><Icon name="plus" size={15} />상품 등록</button></div>
        <div className="assigned-products">{selected.productIds.map((id, index) => { const product = byId.get(id); return <div key={id} className={`assigned-product ${index >= selected.productCount ? "outside-display-count" : ""}`}><span className="assigned-index">{String(index + 1).padStart(2, "0")}</span>{product && <Image src={product.imageUrl} alt="" width={45} height={45} />}<div><strong>{product?.name || id}</strong><small>{id}{!product && " · 현재 미노출 상품"}</small></div>{index >= selected.productCount && <span className="admin-muted-tag">노출 수 초과</span>}<div className="assigned-actions"><button aria-label={`${id} 위로 이동`} disabled={index === 0} onClick={() => moveProduct(index, -1)}>↑</button><button aria-label={`${id} 아래로 이동`} disabled={index === selected.productIds.length - 1} onClick={() => moveProduct(index, 1)}>↓</button><button aria-label={`${id} 구좌에서 제외`} onClick={() => updateSection({ productIds: selected.productIds.filter((value) => value !== id) })}><Icon name="close" size={14} /></button></div></div>; })}{!selected.productIds.length && <div className="admin-empty">등록된 상품이 없습니다. 상품 등록 버튼으로 추가해 주세요.</div>}</div>
      </section> : <section className="admin-card section-editor"><div className="admin-empty">등록된 구좌가 없습니다.<br />상단의 구좌 추가 버튼으로 새 구좌를 만들어 주세요.</div></section>}
    </div>
    {picker && selected && <div className="admin-modal-backdrop"><section className="admin-modal product-picker" role="dialog" aria-modal="true" aria-labelledby="picker-title"><div className="admin-modal-heading"><div><span>PRODUCT SELECTION</span><h2 id="picker-title">구좌에 상품 등록</h2></div><button type="button" aria-label="상품 선택 닫기" onClick={() => setPicker(false)}><Icon name="close" size={19} /></button></div><div className="admin-picker-search"><Icon name="search" size={17} /><input autoFocus aria-label="등록할 상품 검색" placeholder="상품 ID 또는 상품명을 검색하세요" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="admin-picker-results">{available.map((product) => <label key={product.id} className="admin-picker-item"><input type="checkbox" aria-label={`${product.id} 상품 선택`} checked={picked.includes(product.id)} onChange={() => setPicked((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])} /><Image src={product.imageUrl} alt="" width={48} height={48} /><div><strong>{product.name}</strong><small>{product.id}</small></div><span>{formatPrice(product.price)}</span></label>)}{!available.length && <div className="admin-empty">추가할 수 있는 상품이 없습니다.</div>}</div><div className="admin-modal-footer"><span>{picked.length}개 선택</span><button type="button" className="admin-button secondary" onClick={() => setPicker(false)}>취소</button><button type="button" className="admin-button primary" disabled={!picked.length} onClick={() => { updateSection({ productIds: [...selected.productIds, ...picked] }); setPicker(false); }}>선택 상품 추가</button></div></section></div>}
    {confirmDelete && selected && <div className="admin-modal-backdrop"><section className="admin-modal delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-section-title"><h2 id="delete-section-title">선택한 구좌를 삭제할까요?</h2><p>{selected.title}<br />구좌만 삭제되며 상품 정보는 유지됩니다.<br />변경사항 저장을 누르면 메인에 반영됩니다.</p><div className="admin-modal-footer"><button type="button" className="admin-button secondary" onClick={() => setConfirmDelete(false)}>취소</button><button type="button" className="admin-button danger-solid" onClick={removeSection}>구좌 삭제 확인</button></div></section></div>}
  </>;
}
