import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { getAdminDb } from "@/lib/firebase/admin";
import { MODEL_ID, modelDirectory } from "@/lib/cad-converter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { modelId: string } }) {
  if (!MODEL_ID.test(params.modelId)) return new Response(null, { status: 404 });
  const asset = await getAdminDb().collection("modelAssets").doc(params.modelId).get();
  if (!asset.exists) return new Response(null, { status: 404 });
  const filename = path.join(modelDirectory(params.modelId), "model.glb");
  const info = await stat(filename).catch(() => null);
  if (!info) return new Response(null, { status: 404 });
  return new Response(Readable.toWeb(createReadStream(filename)) as ReadableStream, { headers: { "Content-Type": "model/gltf-binary", "Content-Length": String(info.size), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
