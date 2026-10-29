import "server-only";

import { getApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getAdminDb } from "./admin";

/** Firestore와 같은 서버 전용 인증으로 비공개 CAD 버킷에 접근합니다. */
export function getCadBucket(name = process.env.CAD_STORAGE_BUCKET?.trim()) {
  if (!name) throw new Error("CAD_STORAGE_BUCKET 환경변수에 GLB 저장 버킷을 설정하세요.");
  getAdminDb();
  return getStorage(getApp("robotis-shop-server")).bucket(name);
}
