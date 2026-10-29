import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try { process.loadEnvFile(path.join(root, ".env.local")); } catch (error) { if (error.code !== "ENOENT") throw error; }

export async function getAdminDatabase() {
  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;
  const keyJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim();
  if (!keyJson && !keyPath) throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON 또는 FIREBASE_ADMIN_KEY_PATH 환경변수를 설정하세요.");
  let key;
  try { key = JSON.parse((keyJson || await readFile(path.resolve(root, keyPath), "utf8")).replace(/^\uFEFF/, "")); }
  catch { throw new Error("서버용 서비스 계정 JSON을 읽을 수 없습니다. 환경변수 값 또는 로컬 파일을 확인하세요."); }
  if (key?.type !== "service_account" || typeof key.private_key !== "string" || typeof key.client_email !== "string" || key.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("서비스 계정 형식 또는 대상 Firebase 프로젝트가 일치하지 않습니다.");
  }
  const app = getApps().find((item) => item.name === "catalog-import") || initializeApp({ credential: cert(key), projectId: key.project_id }, "catalog-import");
  return getFirestore(app);
}
