"use client";

import { useState } from "react";
import type { ProductModel } from "@/features/products/types/product";
import { Icon } from "@/components/ui/icon";

export function ModelUploader({ model, onChange, onBusyChange }: { model: ProductModel | null; onChange: (model: ProductModel | null) => void; onBusyChange: (busy: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  async function convert() {
    if (!file || busy) return;
    setBusy(true); onBusyChange(true); setFeedback(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/models", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "변환에 실패했습니다.");
      onChange(result.model);
      setFeedback({ ok: true, message: "변환을 완료했습니다. 상품을 저장하면 상세페이지에 반영됩니다." });
    } catch (error) {
      setFeedback({ ok: false, message: error instanceof Error ? error.message : "파일 업로드에 실패했습니다." });
    } finally { setBusy(false); onBusyChange(false); }
  }

  return <section className="admin-card admin-form-card admin-cad-card">
    <div className="admin-card-title"><h2>3D CAD 모델</h2><span>STEP → GLB</span></div>
    <p className="admin-cad-description">STEP 파일을 올려 360° 제품 뷰어에 사용할 모델로 변환하세요. 변환 후 상단의 상품 저장 버튼을 눌러 반영합니다.</p>
    <label className="admin-field"><span>CAD 파일 선택</span><input type="file" aria-label="3D CAD STEP 파일" accept=".step,.stp" disabled={busy} onChange={(event) => {
      const next = event.target.files?.[0] || null;
      setFeedback(null);
      if (next && (!/\.(step|stp)$/i.test(next.name) || next.size > 50 * 1024 * 1024)) { setFile(null); setFeedback({ ok: false, message: "50MB 이하의 STEP 또는 STP 파일을 선택해 주세요." }); return; }
      setFile(next);
    }} /><small>STEP·STP / 최대 50MB. 복잡한 모델은 변환에 수 분이 걸릴 수 있습니다.</small></label>
    <div className="admin-cad-actions"><button type="button" className="admin-button secondary" disabled={!file || busy} onClick={convert}><Icon name="box" size={16} />{busy ? "CAD 모델 변환 중…" : "STEP 파일 변환"}</button>{busy && <span role="status">파일을 변환하고 있습니다. 화면을 유지해 주세요.</span>}</div>
    {feedback && <p role={feedback.ok ? "status" : "alert"} className={`admin-feedback ${feedback.ok ? "success" : "error"}`}>{feedback.message}</p>}
    {model && <div className="admin-cad-asset"><div className="admin-cad-asset-icon"><Icon name="box" size={25} /></div><div><strong>{model.sourceName}</strong><small>GLB · {(model.bytes / 1024 / 1024).toFixed(2)}MB · {model.triangles.toLocaleString()} 삼각형</small><small>{model.dimensionsMm.join(" × ")} mm</small></div><button type="button" className="admin-text-button" disabled={busy} onClick={() => { onChange(null); setFeedback({ ok: true, message: "모델 연결을 해제했습니다. 상품을 저장하면 반영됩니다." }); }}>연결 해제</button></div>}
  </section>;
}
