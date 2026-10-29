export interface ProductModel {
  id: string;
  url: string;
  sourceName: string;
  bytes: number;
  triangles: number;
  dimensionsMm: [number, number, number];
  blenderVersion: string;
  createdAt: string;
}

/** 원본 상품코드를 문서 ID로 사용합니다. 숫자 사양이 없는 상품은 null로 구분합니다. */
export interface Product {
  id: string;
  name: string;
  summary: string;
  price: number | null;
  priceLabel: string;
  imageUrl: string;
  gallery: string[];
  categoryIds: string[];
  categoryName: string;
  series: string;
  communication: string;
  torqueNm: number | null;
  voltageV: number | null;
  speedRpm: number | null;
  leadTime: string;
  manufacturer: string;
  countryOfOrigin: string;
  specifications: { label: string; value: string }[];
  description: string[];
  detailImages: string[];
  resources: { title: string; url: string }[];
  sourceUrl: string;
  sourceUpdatedAt: string;
  published: boolean;
  sortOrder: number;
  model3d: ProductModel | null;
}
