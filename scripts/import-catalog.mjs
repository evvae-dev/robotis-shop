import { readFile } from "node:fs/promises";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDatabase, root } from "./firebase-admin.mjs";

const catalog = JSON.parse(await readFile(path.join(root, "data", "catalog.json"), "utf8"));
if (!catalog.products.length || !catalog.banners.length) throw new Error("수집한 상품과 배너가 없습니다.");
const db = await getAdminDatabase();

// 원본 상품코드·고정 배너 ID를 사용하므로 재실행해도 중복 문서가 생기지 않습니다.
// 관리자에서 추가한 다른 필드를 지우지 않도록 merge를 사용합니다.
for (const [collectionName, records] of [["products", catalog.products], ["banners", catalog.banners]]) {
  for (let offset = 0; offset < records.length; offset += 400) {
    const batch = db.batch();
    for (const { id, ...record } of records.slice(offset, offset + 400)) {
      batch.set(db.collection(collectionName).doc(id), { ...record, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();
  }
}
await db.collection("siteContent").doc("home").set({ ...catalog.siteContent, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

// 저장 후 실제 Firestore 문서를 다시 읽어 수량과 대표 상품을 대조합니다.
const [products, banners, featured] = await Promise.all([
  db.collection("products").where("published", "==", true).get(),
  db.collection("banners").where("published", "==", true).get(),
  db.collection("products").doc("905-0058-000").get(),
]);
if (!featured.exists || featured.data().name !== "HX5-D20-MRT") throw new Error("대표 상품의 저장 검증에 실패했습니다.");
console.log(JSON.stringify({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, products: products.size, banners: banners.size, verifiedProduct: featured.data().name }));
await db.terminate();
