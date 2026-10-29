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
  const keyJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim();
  if (!keyJson && !keyPath) throw new Error("Firestore 서버 인증 JSON 환경변수 또는 로컬 파일 경로를 설정하세요.");
  let key;
  // 배포 환경의 Secret을 우선하고, 로컬 개발에서만 파일 경로로 대체합니다.
  try { key = JSON.parse((keyJson || readFileSync(path.resolve(process.cwd(), keyPath!), "utf8")).replace(/^\uFEFF/, "")); }
  catch { throw new Error("Firestore 서비스 계정 JSON을 읽을 수 없습니다. 환경변수 값 또는 로컬 파일을 확인하세요."); }
  if (key?.type !== "service_account" || typeof key.private_key !== "string" || typeof key.client_email !== "string" || key.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Firestore 서비스 계정 형식 또는 대상 프로젝트가 일치하지 않습니다.");
  }
  return getFirestore(initializeApp({ credential: cert(key), projectId: key.project_id }, "robotis-shop-server"));
}
