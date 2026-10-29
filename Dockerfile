# 쇼핑몰은 Vercel에서, 이 이미지는 Cloud Run의 CAD 변환 API로 실행합니다.
FROM python:3.12-slim-bookworm AS blender
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl xz-utils \
    && curl -fSL --retry 3 https://download.blender.org/release/Blender4.5/blender-4.5.15-linux-x64.tar.xz -o /tmp/blender.tar.xz \
    && echo '0d2b8bb2efe97e6c8eb57de6b7322f8800e1984e3125b60decca5f6771e4773e  /tmp/blender.tar.xz' | sha256sum -c - \
    && mkdir /opt/blender && tar -xJf /tmp/blender.tar.xz -C /opt/blender --strip-components=1

FROM python:3.12-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 \
    BLENDER_PATH=/opt/blender/blender PORT=8080
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libegl1 libx11-6 libxext6 libxrender1 libxi6 libxfixes3 libxxf86vm1 \
    libsm6 libice6 libxkbcommon0 libdbus-1-3 libgomp1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=blender /opt/blender /opt/blender
WORKDIR /app
COPY scripts/cad/requirements.txt scripts/cad/requirements.txt
COPY services/cad/requirements.txt services/cad/requirements.txt
RUN pip install --no-cache-dir -r services/cad/requirements.txt \
    && /opt/blender/blender --background --factory-startup --version \
    && python -c "from OCP.STEPControl import STEPControl_Reader"
COPY scripts/cad/tessellate-step.py scripts/cad/export-glb.py scripts/cad/
COPY services/cad/app.py services/cad/app.py
RUN useradd --create-home cad
USER cad
EXPOSE 8080
CMD ["python", "services/cad/app.py"]
