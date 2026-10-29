import { z } from "zod";
import { isSupportedImageUrl } from "@/lib/image-url";

z.config(z.locales.ko());

const productId = z.string().trim().regex(/^[a-zA-Z0-9_-]{1,80}$/, "상품 ID는 영문·숫자·하이픈·밑줄로 80자 이내로 입력하세요.");
const imageUrl = z.string().trim().max(2000).refine(isSupportedImageUrl, "이미지는 /media/ 경로 또는 ROBOTIS·Firebase Storage의 HTTPS 주소를 입력하세요.");
const optionalNumber = z.number().min(0).max(1e10).nullable();
const webUrl = z.string().trim().max(2000).refine((value) => { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } }, "올바른 자료 링크 주소를 입력하세요.");

export const productSchema = z.object({
  id: productId,
  name: z.string().trim().min(1, "상품명을 입력하세요.").max(160),
  summary: z.string().trim().max(1000),
  price: z.number().int().min(0).max(1e11).nullable(),
  imageUrl,
  gallery: z.array(imageUrl).max(20),
  detailImages: z.array(imageUrl).max(30),
  categoryIds: z.array(z.string().regex(/^\d{2,10}$/)).min(1, "카테고리를 선택하세요.").max(20),
  categoryName: z.string().trim().max(80),
  series: z.enum(["", "X", "Y", "P"]),
  communication: z.enum(["", "TTL", "RS-485"]),
  torqueNm: optionalNumber,
  voltageV: optionalNumber,
  speedRpm: optionalNumber,
  leadTime: z.string().trim().max(100),
  manufacturer: z.string().trim().max(100),
  countryOfOrigin: z.string().trim().max(80),
  description: z.array(z.string().trim().min(1).max(3000)).max(50),
  specifications: z.array(z.object({ label: z.string().trim().min(1).max(100), value: z.string().trim().min(1).max(1000) })).max(60),
  resources: z.array(z.object({ title: z.string().trim().min(1).max(100), url: webUrl })).max(20),
  published: z.boolean(),
  modelId: z.string().uuid().nullable().default(null),
});
export type ProductInput = z.infer<typeof productSchema>;

export const homeSectionsSchema = z.array(z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  title: z.string().trim().min(1, "구좌 타이틀을 입력하세요.").max(80),
  subtitle: z.string().trim().max(160),
  productCount: z.number().int().min(0).max(50),
  productIds: z.array(productId).max(100),
  order: z.number().int().min(0).max(100),
})).max(20).refine((sections) => new Set(sections.map((section) => section.id)).size === sections.length, "구좌 ID가 중복되었습니다. 새로고침한 뒤 다시 저장하세요.");
export const deletionSchema = z.array(productId).min(1, "삭제할 상품을 선택하세요.").max(100);
