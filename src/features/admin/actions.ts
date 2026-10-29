"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { deletionSchema, homeSectionsSchema, productSchema } from "./lib/schemas";
import type { AdminResult } from "./lib/admin-types";

const failure = (error: unknown): AdminResult => ({ ok: false, message: error instanceof Error ? error.message : "저장 중 문제가 발생했습니다." });

export async function saveHomeSections(input: unknown): Promise<AdminResult> {
  const parsed = homeSectionsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  try {
    const db = getAdminDb();
    const sections = parsed.data.map((section, order) => ({ ...section, order, productIds: [...new Set(section.productIds)] }));
    await db.runTransaction(async (transaction) => {
      const homeRef = db.collection("siteContent").doc("home");
      const ids = [...new Set(sections.flatMap((section) => section.productIds))];
      const products = ids.length ? await transaction.getAll(...ids.map((id) => db.collection("products").doc(id))) : [];
      if (products.some((product) => !product.exists || product.data()?.deleted || !product.data()?.published)) {
        throw new Error("노출 중인 상품만 구좌에 등록할 수 있습니다. 삭제·미노출 상품을 제외해 주세요.");
      }
      transaction.update(homeRef, { homeSections: sections, updatedAt: FieldValue.serverTimestamp() });
    });
    revalidatePath("/", "layout");
    return { ok: true, message: "메인 구좌를 저장했습니다. 스토어에 반영되었습니다." };
  } catch (error) { return failure(error); }
}

export async function saveProduct(input: unknown, mode: "create" | "update"): Promise<AdminResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (mode !== "create" && mode !== "update") return { ok: false, message: "올바르지 않은 저장 요청입니다." };
  try {
    const db = getAdminDb();
    const data = parsed.data;
    const basics = [
      { label: "상품코드", value: data.id }, { label: "제조사", value: data.manufacturer },
      { label: "원산지", value: data.countryOfOrigin }, { label: "준비기간", value: data.leadTime },
    ].filter((row) => row.value);
    await db.runTransaction(async (transaction) => {
      const reference = db.collection("products").doc(data.id);
      const existing = await transaction.get(reference);
      if (mode === "create" && existing.exists) throw new Error("이미 사용 중인 상품 ID입니다.");
      if (mode === "update" && !existing.exists) throw new Error("수정할 상품을 찾을 수 없습니다.");
      const model = data.modelId ? await transaction.get(db.collection("modelAssets").doc(data.modelId)) : null;
      if (model && !model.exists) throw new Error("변환된 3D 모델을 찾을 수 없습니다. STEP 파일을 다시 올려 주세요.");
      const { id, modelId, ...fields } = data;
      transaction.set(reference, {
        ...fields,
        model3d: model?.data() ?? null,
        gallery: [...new Set([fields.imageUrl, ...fields.gallery])],
        specifications: [...basics, ...data.specifications.filter((row) => !["상품코드", "제조사", "원산지", "준비기간"].includes(row.label))],
        priceLabel: data.price === null ? "견적 문의" : "",
        deleted: false,
        deletedAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
        ...(!existing.exists ? { createdAt: FieldValue.serverTimestamp(), sourceUrl: "", sourceUpdatedAt: new Date().toISOString(), sortOrder: Date.now() } : {}),
      }, { merge: true });
    });
    revalidatePath("/", "layout");
    return { ok: true, message: mode === "create" ? "상품을 등록했습니다." : "상품을 저장했습니다.", id: data.id };
  } catch (error) { return failure(error); }
}

export async function deleteProducts(input: unknown): Promise<AdminResult> {
  const parsed = deletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  try {
    const ids = [...new Set(parsed.data)];
    const db = getAdminDb();
    await db.runTransaction(async (transaction) => {
      const homeRef = db.collection("siteContent").doc("home");
      const home = await transaction.get(homeRef);
      const products = await transaction.getAll(...ids.map((id) => db.collection("products").doc(id)));
      // 문서를 남겨 복구할 수 있게 하며, 메인 구좌의 연결도 같은 트랜잭션에서 제거합니다.
      for (const product of products) {
        if (product.exists) transaction.update(product.ref, { deleted: true, published: false, deletedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      }
      if (home.exists) transaction.update(homeRef, { homeSections: home.data()!.homeSections.map((section: { productIds: string[] }) => ({ ...section, productIds: section.productIds.filter((id) => !ids.includes(id)) })), updatedAt: FieldValue.serverTimestamp() });
    });
    revalidatePath("/", "layout");
    return { ok: true, message: `${ids.length}개 상품을 삭제했습니다. 스토어에서 노출되지 않습니다.` };
  } catch (error) { return failure(error); }
}
