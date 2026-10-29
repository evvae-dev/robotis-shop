import "server-only";

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { getCadBucket } from "@/lib/firebase/storage";
import { getCadConfig } from "@/lib/cad-config";
import type { ProductModel } from "@/features/products/types/product";

const exec = promisify(execFile);
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
export const MODEL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const metadataSchema = z.object({ dimensionsMm: z.tuple([z.number().finite().nonnegative(), z.number().finite().nonnegative(), z.number().finite().nonnegative()]), triangles: z.number().int().positive().max(1_500_000), blenderVersion: z.string().max(40) });

export class CadError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function modelDirectory(id: string) {
  if (!MODEL_ID.test(id)) throw new CadError("올바르지 않은 모델 ID입니다.");
  return path.join(path.resolve(process.env.CAD_STORAGE_PATH || path.join(process.cwd(), ".data/models")), id);
}

async function convertRemote(file: File, apiUrl: string): Promise<ProductModel> {
  if (!process.env.CAD_STORAGE_BUCKET?.trim()) throw new CadError("CAD_STORAGE_BUCKET에 GLB를 보관할 버킷 이름을 설정해 주세요.", 503);
  const bucket = getCadBucket();
  // 변환 비용이 발생하기 전에 버킷의 존재와 접근 권한을 확인합니다.
  try { await bucket.getFiles({ prefix: "cad-models/", maxResults: 1, autoPaginate: false }); }
  catch { throw new CadError("CAD 저장 버킷이 없거나 접근할 수 없습니다. 버킷 이름과 서비스 계정 권한을 확인해 주세요.", 503); }
  const body = new FormData();
  body.append("file", file);
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/convert`, { method: "POST", body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(270_000) });
  } catch (error) {
    throw new CadError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "CAD API 응답 시간이 초과됐습니다. 간략화한 모델로 다시 시도해 주세요." : "CAD API에 연결할 수 없습니다. 서비스 주소와 배포 상태를 확인해 주세요.", 504);
  }
  if (!response.ok) {
    await response.body?.cancel();
    const messages: Record<number, string> = { 400: "유효한 STEP 파일이 아닙니다.", 401: "CAD API의 인증 설정을 확인해 주세요.", 403: "CAD API의 공개 액세스 설정을 확인해 주세요.", 409: "다른 모델을 변환 중입니다. 잠시 후 다시 시도해 주세요.", 413: "CAD API가 파일 크기 제한을 초과했습니다.", 422: "CAD 형상을 변환하지 못했습니다. 파일과 서버 도구를 확인해 주세요.", 503: "CAD API 설정이 완료되지 않았습니다. 최신 코드로 배포했는지 확인해 주세요.", 504: "CAD API 변환 시간이 초과됐습니다." };
    throw new CadError(messages[response.status] || "CAD API 변환에 실패했습니다.", messages[response.status] ? response.status : 502);
  }
  let data: z.infer<typeof metadataSchema>;
  try {
    const header = response.headers.get("x-cad-metadata");
    if (!header || header.length > 8192) throw new Error();
    data = metadataSchema.parse(JSON.parse(Buffer.from(header, "base64").toString("utf8")));
  } catch {
    await response.body?.cancel();
    throw new CadError("CAD API의 모델 메타데이터가 올바르지 않습니다.", 502);
  }
  // 응답 크기를 직접 제한해 Content-Length가 없는 응답도 안전하게 처리합니다.
  const reader = response.body?.getReader();
  if (!reader) throw new CadError("CAD API가 모델 파일을 반환하지 않았습니다.", 502);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_OUTPUT_BYTES) { await reader.cancel(); throw new CadError("변환 결과가 32MB를 초과합니다.", 413); }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof CadError) throw error;
    throw new CadError("CAD 모델을 전송받지 못했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }
  const glb = Buffer.concat(chunks, size);
  if (glb.length < 12 || glb.toString("ascii", 0, 4) !== "glTF" || glb.readUInt32LE(4) !== 2 || glb.readUInt32LE(8) !== size) {
    throw new CadError("CAD API가 올바른 GLB 파일을 반환하지 않았습니다.", 502);
  }
  const id = randomUUID();
  const output = bucket.file(`cad-models/${id}/model.glb`);
  const source = bucket.file(`cad-models/${id}/source.step`);
  const model: ProductModel = { id, url: `/api/models/${id}`, sourceName: file.name.replace(/[\\/]/g, "_").slice(0, 160), bytes: size, ...data, createdAt: new Date().toISOString() };
  try {
    await source.save(Buffer.from(await file.arrayBuffer()), { resumable: false, contentType: "application/step" });
    await output.save(glb, { resumable: false, contentType: "model/gltf-binary" });
    await getAdminDb().collection("modelAssets").doc(id).create({ ...model, storage: { bucket: bucket.name, object: output.name } });
    return model;
  } catch {
    await Promise.allSettled([source.delete({ ignoreNotFound: true }), output.delete({ ignoreNotFound: true })]);
    throw new CadError("변환 모델을 저장하지 못했습니다. Storage 쓰기 권한과 Firestore 연결을 확인해 주세요.", 502);
  }
}

export async function convertStep(file: File): Promise<ProductModel> {
  const { apiUrl, maxUploadMb } = getCadConfig();
  if (!/\.(step|stp)$/i.test(file.name)) throw new CadError("STEP 또는 STP 파일을 선택해 주세요.");
  if (!file.size || file.size > maxUploadMb * 1024 * 1024) throw new CadError(`STEP 파일은 ${maxUploadMb}MB 이하로 올려 주세요.`, 413);
  const header = await file.slice(0, 2048).text();
  if (!/^\s*ISO-10303-21\s*;/i.test(header.replace(/^\uFEFF/, ""))) throw new CadError("유효한 STEP 파일이 아닙니다. 파일 내용을 확인해 주세요.");
  if (apiUrl) return convertRemote(file, apiUrl);
  if (process.env.VERCEL) throw new CadError("배포 환경의 CAD_API_URL을 설정해 주세요.", 503);

  const windows = process.platform === "win32";
  const python = process.env.CAD_PYTHON_PATH || path.join(process.cwd(), ".venv-cad", windows ? "Scripts/python.exe" : "bin/python");
  const blender = process.env.BLENDER_PATH || (windows ? path.join(process.cwd(), ".tools/blender-4.5.15-windows-x64/blender.exe") : "blender");
  try { await access(python); if (windows || path.isAbsolute(blender)) await access(blender); }
  catch { throw new CadError("CAD 변환 도구가 준비되지 않았습니다. 서버에서 npm run cad:setup을 실행해 주세요.", 503); }

  const id = randomUUID();
  const directory = modelDirectory(id);
  const source = path.join(directory, "source.step");
  const mesh = path.join(directory, "mesh.stl");
  const output = path.join(directory, "model.glb");
  const metadata = path.join(directory, "metadata.json");
  await mkdir(directory, { recursive: true });
  await writeFile(source, Buffer.from(await file.arrayBuffer()));
  let complete = false;
  try {
    // 셸을 거치지 않고 고정 스크립트와 서버가 만든 경로만 실행 인수로 전달합니다.
    const options = { cwd: process.cwd(), timeout: 180_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true, env: { ...process.env, PYTHONUTF8: "1" } };
    await exec(python, [path.join(process.cwd(), "scripts/cad/tessellate-step.py"), source, mesh, metadata], options);
    await exec(blender, ["--background", "--factory-startup", "--threads", "2", "--python-exit-code", "1", "--python", path.join(process.cwd(), "scripts/cad/export-glb.py"), "--", mesh, output, metadata], options);
    const [info, outputStat] = await Promise.all([readFile(metadata, "utf8"), stat(output)]);
    const data = metadataSchema.parse(JSON.parse(info));
    if (outputStat.size > MAX_OUTPUT_BYTES) throw new CadError("변환 결과가 32MB를 초과합니다. 간략화한 CAD 파일을 올려 주세요.");
    const model: ProductModel = { id, url: `/api/models/${id}`, sourceName: file.name.replace(/[\\/]/g, "_").slice(0, 160), bytes: outputStat.size, ...data, createdAt: new Date().toISOString() };
    // 파일 저장을 마친 모델만 연결할 수 있도록 메타데이터를 마지막에 기록합니다.
    await getAdminDb().collection("modelAssets").doc(id).create(model);
    complete = true;
    return model;
  } catch (error) {
    if (error instanceof CadError) throw error;
    console.error("CAD 변환 실패", error instanceof Error ? error.message : error);
    throw new CadError("CAD 변환에 실패했습니다. 손상 여부와 형상 복잡도를 확인한 뒤 다시 올려 주세요.", 422);
  } finally {
    await unlink(mesh).catch(() => {});
    await unlink(metadata).catch(() => {});
    if (!complete) await Promise.all([source, output].map((filePath) => unlink(filePath).catch(() => {})));
  }
}
