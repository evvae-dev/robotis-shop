"""Cloud Run 전용 STEP → GLB API. 임시 파일은 응답 이후 정리합니다."""
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import threading

from fastapi import FastAPI, HTTPException, UploadFile
from starlette.background import BackgroundTask
from starlette.responses import FileResponse
import uvicorn

ROOT = Path(__file__).resolve().parents[2]
# Cloud Run HTTP/1 요청 크기 한도 안에 multipart 헤더까지 들어가도록 제한합니다.
MAX_INPUT = 30 * 1024 * 1024
MAX_OUTPUT = 32 * 1024 * 1024
CONVERTING = threading.Lock()
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok", "service": "robotis-cad"}


def run_tool(arguments):
    subprocess.run(
        arguments, cwd=ROOT, check=True, timeout=180,
        stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )


@app.post("/convert")
def convert(file: UploadFile):
    if Path(file.filename or "").suffix.lower() not in (".step", ".stp"):
        raise HTTPException(400, "STEP 또는 STP 파일을 선택해 주세요.")
    if file.size is not None and file.size > MAX_INPUT:
        raise HTTPException(413, "Cloud Run 변환 파일은 30MB 이하여야 합니다.")
    if not CONVERTING.acquire(blocking=False):
        raise HTTPException(409, "다른 모델을 변환 중입니다. 잠시 후 다시 시도해 주세요.")
    temporary = tempfile.TemporaryDirectory(prefix="robotis-cad-")
    try:
        directory = Path(temporary.name)
        source, mesh, output, metadata = (directory / name for name in (
            "source.step", "mesh.stl", "model.glb", "metadata.json"
        ))
        size = 0
        with source.open("wb") as stream:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_INPUT:
                    raise HTTPException(413, "Cloud Run 변환 파일은 30MB 이하여야 합니다.")
                stream.write(chunk)
        with source.open("rb") as stream:
            header = stream.read(2048).decode("utf-8-sig", errors="replace")
        if not re.match(r"\s*ISO-10303-21\s*;", header, re.IGNORECASE):
            raise HTTPException(400, "유효한 STEP 파일이 아닙니다.")
        run_tool([os.environ.get("CAD_PYTHON_PATH") or sys.executable,
                  str(ROOT / "scripts/cad/tessellate-step.py"), str(source), str(mesh), str(metadata)])
        run_tool([os.environ.get("BLENDER_PATH") or "blender", "--background", "--factory-startup",
                  "--threads", "2", "--python-exit-code", "1", "--python",
                  str(ROOT / "scripts/cad/export-glb.py"), "--", str(mesh), str(output), str(metadata)])
        if output.stat().st_size > MAX_OUTPUT:
            raise HTTPException(413, "변환 결과가 32MB를 초과합니다.")
        data = json.loads(metadata.read_text(encoding="utf-8"))
        encoded = base64.b64encode(json.dumps(data).encode()).decode("ascii")
        # 영구 저장은 호출자가 처리합니다. Cloud Run 인스턴스의 디스크에 의존하지 않습니다.
        return FileResponse(output, media_type="model/gltf-binary", filename="model.glb",
                            headers={"X-CAD-Metadata": encoded, "Cache-Control": "no-store"},
                            background=BackgroundTask(temporary.cleanup))
    except HTTPException:
        temporary.cleanup()
        raise
    except subprocess.TimeoutExpired:
        temporary.cleanup()
        raise HTTPException(504, "CAD 변환 시간이 초과됐습니다.") from None
    except (subprocess.CalledProcessError, OSError, ValueError):
        temporary.cleanup()
        raise HTTPException(422, "CAD 변환에 실패했습니다. 파일 형상과 서버 도구를 확인해 주세요.") from None
    finally:
        CONVERTING.release()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8080")), workers=1)
