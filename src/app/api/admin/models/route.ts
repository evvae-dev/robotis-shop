import { NextResponse } from "next/server";
import { CadError, convertStep } from "@/lib/cad-converter";

export const runtime = "nodejs";
export const maxDuration = 360;
let converting = false;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Next.js 내부 URL은 localhost로 정규화될 수 있어 실제 요청의 Host와 비교합니다.
  if (origin && !["http:", "https:"].some((protocol) => origin === `${protocol}//${request.headers.get("host")}`)) return NextResponse.json({ message: "같은 사이트에서 파일을 올려 주세요." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 50 * 1024 * 1024 + 65536) return NextResponse.json({ message: "STEP 파일은 50MB 이하로 올려 주세요." }, { status: 413 });
  if (converting) return NextResponse.json({ message: "다른 모델을 변환 중입니다. 완료 후 다시 시도해 주세요." }, { status: 409 });
  converting = true;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new CadError("변환할 STEP 파일을 선택해 주세요.");
    return NextResponse.json({ model: await convertStep(file) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof CadError ? error.message : "파일 업로드에 실패했습니다. 다시 시도해 주세요." }, { status: error instanceof CadError ? error.status : 500 });
  } finally { converting = false; }
}
