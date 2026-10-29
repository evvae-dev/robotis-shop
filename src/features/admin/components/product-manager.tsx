"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { deleteProducts } from "../actions";
import type { AdminProduct } from "../lib/admin-types";
import { notifyStoreUpdate } from "../lib/notify-store";

const ProductGrid = dynamic(() => import("./product-grid"), { ssr: false, loading: () => <div className="admin-grid-loading" role="status">상품 그리드를 불러오는 중입니다.</div> });

export function ProductManager({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [series, setSeries] = useState("");
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState({ keyword: "", series: "", status: "active" });
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [gridVersion, setGridVersion] = useState(0);
  useEffect(() => { setSelected([]); setGridVersion((value) => value + 1); }, [products]);
  const rows = useMemo(() => products.filter((product) => {
    if (search.status === "active" && product.deleted) return false;
    if (search.status === "published" && (product.deleted || !product.published)) return false;
    if (search.status === "hidden" && (product.deleted || product.published)) return false;
    if (search.status === "deleted" && !product.deleted) return false;
    if (search.series && product.series !== search.series) return false;
    return !search.keyword || `${product.id} ${product.name} ${product.summary}`.toLowerCase().includes(search.keyword.toLowerCase());
  }), [products, search]);
  async function remove() {
    setPending(true);
    try {
      const result = await deleteProducts(selected);
      setFeedback(result);
      if (result.ok) { setSelected([]); setConfirmDelete(false); notifyStoreUpdate(); router.refresh(); }
    } catch { setFeedback({ ok: false, message: "삭제에 실패했습니다. 다시 시도해 주세요." }); }
    finally { setPending(false); }
  }

  return <>
    <div className="admin-page-heading"><div><span>PRODUCT CATALOG</span><h1>상품관리</h1><p>상품을 검색하고 등록 정보와 스토어 노출 상태를 관리합니다.</p></div><Link href="/admin/products/new" className="admin-button primary"><Icon name="plus" size={17} />상품 등록</Link></div>
    {feedback && <p className={`admin-feedback ${feedback.ok ? "success" : "error"}`} role={feedback.ok ? "status" : "alert"}>{feedback.message}</p>}
    <section className="admin-card admin-search-card"><form onSubmit={(event) => { event.preventDefault(); setSelected([]); setSearch({ keyword: keyword.trim(), series, status }); setGridVersion((value) => value + 1); }}><label className="admin-field admin-search-keyword">상품 검색<div className="admin-search-input"><Icon name="search" size={17} /><input aria-label="상품 검색어" placeholder="상품 ID 또는 상품명" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></div></label><label className="admin-field">시리즈<select aria-label="상품 시리즈 검색" value={series} onChange={(event) => setSeries(event.target.value)}><option value="">전체 시리즈</option><option value="Y">DYNAMIXEL Y</option><option value="X">DYNAMIXEL X</option><option value="P">DYNAMIXEL P</option></select></label><label className="admin-field">노출 상태<select aria-label="상품 상태 검색" value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">전체 상품</option><option value="published">노출</option><option value="hidden">미노출</option><option value="deleted">삭제 상품</option><option value="all">삭제 포함 전체</option></select></label><div className="admin-search-actions"><button className="admin-button primary" type="submit">검색</button><button className="admin-button secondary" type="button" onClick={() => { setKeyword(""); setSeries(""); setStatus("active"); setSearch({ keyword: "", series: "", status: "active" }); setGridVersion((value) => value + 1); setSelected([]); }}>초기화</button></div></form></section>
    <section className="admin-card admin-grid-card"><div className="admin-grid-toolbar"><div><h2>상품 목록 <span data-testid="admin-product-count">{rows.length}</span></h2><span className="admin-grid-hint">상품 ID를 클릭하면 상세 정보를 수정할 수 있습니다.</span></div><div><span className="admin-selection-count">{selected.length}개 선택</span><button className="admin-button danger small" disabled={!selected.length || pending} onClick={() => setConfirmDelete(true)}><Icon name="close" size={14} />선택 삭제</button></div></div><ProductGrid key={gridVersion} rows={rows} onSelection={setSelected} /></section>
    {confirmDelete && <div className="admin-modal-backdrop"><section className="admin-modal delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="admin-delete-icon"><Icon name="box" size={26} /></div><h2 id="delete-title">선택한 {selected.length}개 상품을 삭제할까요?</h2><p>스토어 노출과 메인 구좌 연결이 해제됩니다.<br />상품 정보는 보관되며 삭제 상품에서 복구할 수 있습니다.</p><div className="admin-modal-footer"><button type="button" className="admin-button secondary" disabled={pending} onClick={() => setConfirmDelete(false)}>취소</button><button type="button" className="admin-button danger-solid" disabled={pending} onClick={remove}>{pending ? "삭제 중…" : "삭제 실행"}</button></div></section></div>}
  </>;
}
