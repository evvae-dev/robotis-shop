"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import type { Product } from "../types/product";
import type { ModelView } from "./ym080-scene";

function ViewerPlaceholder() {
  return <div className="model-loading" role="status"><Icon name="box" size={40} /><span>3D 모델을 준비하고 있습니다.</span></div>;
}

const Ym080Scene = dynamic(() => import("./ym080-scene"), { ssr: false, loading: ViewerPlaceholder });

class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p className="model-webgl-fallback">3D 뷰어를 실행할 수 없습니다. 위의 제품 사진을 확인해 주세요.</p> : this.props.children;
  }
}

export function ProductModelViewer({ product }: { product: Product }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [view, setView] = useState<ModelView>({ preset: "perspective", revision: 0 });

  useEffect(() => {
    setAutoRotate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let visible = false;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) setReady(true);
      update();
    });
    if (container.current) observer.observe(container.current);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  const changeView = (preset: ModelView["preset"]) => {
    setAutoRotate(false);
    setView((previous) => ({ preset, revision: previous.revision + 1 }));
  };

  return <div className="product-model-section">
    <div className="model-section-heading"><div><span className="section-eyebrow">INTERACTIVE PRODUCT VIEW</span><h2>모든 각도에서 살펴보세요.</h2><p>드래그하여 회전하고, 휠 또는 두 손가락으로 확대할 수 있습니다.</p></div><span className="model-preview-badge">3D PREVIEW</span></div>
    <div className="product-model-layout">
      <div className={`model-viewport${product.model3d ? " is-cad-model" : ""}`} ref={container}>
        <div className="model-viewport-label"><span className="model-status-dot" />LIVE 3D <span>{product.model3d ? "CAD MODEL" : "YM080 / DYNAMIXEL-Y"}</span></div>
        <div className="model-canvas" aria-label={`${product.name} 회전 가능한 3D 모델`}>
          <ViewerBoundary key={product.model3d?.id || product.id}>{ready ? <Ym080Scene modelUrl={product.model3d?.url} autoRotate={autoRotate} active={active} view={view} /> : <ViewerPlaceholder />}</ViewerBoundary>
        </div>
        <div className="model-view-controls" role="group" aria-label="3D 시점 선택"><button type="button" onClick={() => changeView("perspective")} aria-label="3D 시점 초기화"><Icon name="box" size={15} />기본 보기</button><button type="button" onClick={() => changeView("front")} aria-pressed={view.preset === "front"}>정면</button><button type="button" onClick={() => changeView("top")} aria-pressed={view.preset === "top"}>상단</button><button type="button" onClick={() => setAutoRotate((value) => !value)} aria-pressed={autoRotate} aria-label="3D 자동 회전">{autoRotate ? "Ⅱ" : "▷"}<span>{autoRotate ? "회전 일시정지" : "자동 회전"}</span></button></div>
      </div>
      <aside className="model-information"><span className="section-eyebrow">{product.series ? `DYNAMIXEL ${product.series} SERIES` : "ROBOTIS PRODUCT"}</span><h3>{product.name}</h3><p>{product.model3d ? "CAD 모델로 제품의 형상과 구조를 자세히 확인하세요." : <>정밀한 움직임을 위한<br />프리미엄 통합 액추에이터</>}</p><dl><div><dt>외형 규격</dt><dd>{product.model3d ? product.model3d.dimensionsMm.map((value) => Number(value.toFixed(1))).join(" × ") : "Ø80 × 100.1"} <small>mm</small></dd></div>{product.voltageV !== null && <div><dt>입력 전압</dt><dd>{product.voltageV} <small>V</small></dd></div>}{product.torqueNm !== null && <div><dt>토크</dt><dd>{product.torqueNm} <small>N·m</small></dd></div>}{product.communication && <div><dt>통신 방식</dt><dd>{product.communication}</dd></div>}</dl><div className="model-information-note"><Icon name="info" size={16} /><p>{product.model3d ? "등록된 STEP CAD에서 변환한 외관 확인용 모델입니다. 색상은 형상을 보기 쉽게 표현했으며, 정밀 치수는 원본 도면을 확인해 주세요." : "제품 사진과 외형 치수를 참고한 간략한 3D 모델입니다. 정확한 형상은 공식 도면을 확인해 주세요."}</p></div></aside>
    </div>
  </div>;
}
