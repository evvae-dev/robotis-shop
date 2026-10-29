"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef, type ICellRendererParams, type RowSelectionOptions } from "ag-grid-community";
import { formatPrice } from "@/lib/format";
import type { AdminProduct } from "../lib/admin-types";

ModuleRegistry.registerModules([AllCommunityModule]);
const theme = themeQuartz.withParams({ fontFamily: '"Google Sans", "Noto Sans KR Variable", sans-serif', fontSize: 13, headerFontSize: 11, headerHeight: 43, rowHeight: 58, borderColor: "#e6eaf0", headerBackgroundColor: "#f7f9fc", foregroundColor: "#526079", accentColor: "#385d90", checkboxCheckedBackgroundColor: "#385d90", wrapperBorderRadius: 0 });
const localeText = { page: "페이지", to: "–", of: "/", more: "더 보기", next: "다음", last: "마지막", first: "처음", previous: "이전", pageSizeSelectorLabel: "표시 수", noRowsToShow: "검색 결과가 없습니다.", loadingOoo: "불러오는 중…", selectAll: "전체 선택", searchOoo: "검색…", filterOoo: "필터…", equals: "같음", notEqual: "다름", contains: "포함", notContains: "포함하지 않음", startsWith: "시작", endsWith: "끝", blank: "빈 값", notBlank: "비어 있지 않음", andCondition: "그리고", orCondition: "또는", applyFilter: "적용", resetFilter: "초기화", clearFilter: "지우기" };

export default function ProductGrid({ rows, onSelection }: { rows: AdminProduct[]; onSelection: (ids: string[]) => void }) {
  const columns = useMemo<ColDef<AdminProduct>[]>(() => [
    { field: "id", headerName: "상품 ID", width: 173, pinned: "left", cellRenderer: (params: ICellRendererParams<AdminProduct>) => params.data && <Link className="admin-grid-id" href={`/admin/products/${params.data.id}`}>{params.data.id}</Link> },
    { field: "name", headerName: "상품명", minWidth: 230, flex: 1 },
    { field: "categoryName", headerName: "카테고리", width: 140 },
    { field: "series", headerName: "시리즈", width: 95, valueFormatter: (params) => params.value || "—" },
    { field: "price", headerName: "판매가", width: 145, type: "numericColumn", valueFormatter: (params) => formatPrice(params.value) },
    { field: "published", headerName: "상태", width: 105, cellRenderer: (params: ICellRendererParams<AdminProduct>) => params.data && <span className={`admin-grid-status ${params.data.deleted ? "deleted" : params.data.published ? "published" : "hidden"}`}>{params.data.deleted ? "삭제" : params.data.published ? "노출" : "미노출"}</span> },
  ], []);
  const rowSelection = useMemo<RowSelectionOptions<AdminProduct>>(() => ({ mode: "multiRow", selectAll: "filtered", enableClickSelection: false, isRowSelectable: (node) => !node.data?.deleted }), []);
  return <div className="admin-product-grid"><AgGridReact<AdminProduct> theme={theme} rowData={rows} columnDefs={columns} defaultColDef={{ sortable: true, resizable: true, filter: true }} getRowId={(params) => params.data.id} rowSelection={rowSelection} selectionColumnDef={{ pinned: "left", width: 48 }} onSelectionChanged={(event) => onSelection(event.api.getSelectedRows().map((product) => product.id))} pagination paginationPageSize={10} paginationPageSizeSelector={[10, 20, 50]} localeText={localeText} /></div>;
}
