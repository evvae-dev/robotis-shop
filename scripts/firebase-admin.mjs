import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try { process.loadEnvFile(path.join(root, ".env.local")); } catch (error) { if (error.code !== "ENOENT") throw error; }

export async function getAdminDatabase() {
  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;
  if (!keyPath) throw new Error("FIREBASE_ADMIN_KEY_PATH 환경변수에 서비스 계정 파일 경로를 지정하세요.");
  let key;
  try { key = JSON.parse(await readFile(path.resolve(root, keyPath), "utf8")); }
  catch { throw new Error("서버용 서비스 계정 JSON을 읽을 수 없습니다. 웹 firebaseConfig 코드와는 다른 파일입니다."); }
  if (key.type !== "service_account" || !key.private_key || key.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("서비스 계정 형식 또는 대상 Firebase 프로젝트가 일치하지 않습니다.");
  }
  const app = getApps().find((item) => item.name === "catalog-import") || initializeApp({ credential: cert(key), projectId: key.project_id }, "catalog-import");
  return getFirestore(app);
}
