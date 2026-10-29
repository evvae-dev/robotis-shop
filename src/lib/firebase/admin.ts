import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/** 서비스 계정은 서버에서만 읽습니다. 공개 NEXT_PUBLIC 환경변수에 비공개 키를 넣지 않습니다. */
export function getAdminDb() {
  const existing = getApps().find((app) => app.name === "robotis-shop-server");
  if (existing) return getFirestore(existing);

  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;
  if (!keyPath) throw new Error("Firestore 서버 인증 파일 경로가 설정되지 않았습니다.");
  let key;
  try { key = JSON.parse(readFileSync(path.resolve(process.cwd(), keyPath), "utf8")); }
  catch { throw new Error("Firestore 서비스 계정 JSON 파일을 읽을 수 없습니다."); }
  if (key.type !== "service_account" || !key.private_key || key.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firestore 서비스 계정 형식 또는 대상 프로젝트가 일치하지 않습니다.");
  }
  return getFirestore(initializeApp({ credential: cert(key), projectId: key.project_id }, "robotis-shop-server"));
}
