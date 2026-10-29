import "server-only";

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import type { ProductModel } from "@/features/products/types/product";

const exec = promisify(execFile);
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MODEL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const metadataSchema = z.object({ dimensionsMm: z.tuple([z.number().finite().nonnegative(), z.number().finite().nonnegative(), z.number().finite().nonnegative()]), triangles: z.number().int().positive().max(1_500_000), blenderVersion: z.string().max(40) });

export class CadError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function modelDirectory(id: string) {
  if (!MODEL_ID.test(id)) throw new CadError("올바르지 않은 모델 ID입니다.");
  return path.join(path.resolve(process.env.CAD_STORAGE_PATH || path.join(process.cwd(), ".data/models")), id);
}

export async function convertStep(file: File): Promise<ProductModel> {
  if (!/\.(step|stp)$/i.test(file.name)) throw new CadError("STEP 또는 STP 파일을 선택해 주세요.");
  if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new CadError("STEP 파일은 50MB 이하로 올려 주세요.", 413);
  const header = await file.slice(0, 2048).text();
  if (!/^\s*ISO-10303-21\s*;/i.test(header.replace(/^\uFEFF/, ""))) throw new CadError("유효한 STEP 파일이 아닙니다. 파일 내용을 확인해 주세요.");

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
    if (outputStat.size > 32 * 1024 * 1024) throw new CadError("변환 결과가 32MB를 초과합니다. 간략화한 CAD 파일을 올려 주세요.");
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
