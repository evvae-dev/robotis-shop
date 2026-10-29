import "server-only";

/** 로컬에서는 CAD_API_URL을 비워 기존 Blender 실행 경로를 사용합니다. */
export function getCadConfig() {
  const apiUrl = process.env.CAD_API_URL?.trim().replace(/\/+$/, "") || "";
  return { apiUrl, maxUploadMb: apiUrl ? 4 : 50 };
}
