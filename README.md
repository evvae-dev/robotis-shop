# ROBOTIS 스토어 포트폴리오

원본 ROBOTIS의 메인 구성을 유지하고 상품 목록과 상세 정보를 다듬은 Next.js 14 프로젝트입니다. 스토어 세 화면과 React·Next.js 기반 관리자를 제공합니다.

[포트폴리오 PDF](docs/ROBOTIS_Store_Portfolio.pdf)

## 실행

Node.js 22 이상을 사용합니다.

```powershell
npm ci
npm run dev
```

터미널에 표시되는 `http://127.0.0.1:3000` 또는 사용 가능한 다음 포트로 접속합니다. 같은 PC의 다른 프로젝트와 구분하기 위해 IPv4 주소를 사용합니다.

| 화면 | 경로 | 기준 원본 |
| --- | --- | --- |
| 메인 | `/` | `https://www.robotis.com/shop/` |
| 상품 목록 | `/products?category=2050` | `https://www.robotis.com/shop/list.php?ca_id=2050` |
| 상품 상세 | `/products/905-0058-000` | `https://www.robotis.com/shop/item.php?it_id=905-0058-000` |
| 메인관리 | `/admin/main` | 메인 구좌 설정·상품 배치 |
| 상품관리 | `/admin/products` | 검색·등록·수정·선택 삭제 |

## 구현 범위

- 메인: 원본 로고·상단 메뉴·왼쪽 카테고리·배너·배너 선택 탭·신제품·추천액츄에이터·교육키트·벌크상품 구성 유지
- 목록: 상품 카드, 가격·상품명 정렬, 시리즈·통신 방식·토크 필터, 그리드·리스트 전환, 검색과 모바일 필터
- 상세: 실제 이미지 갤러리, 수량별 합계, 구조화된 제품 사양, 관련 문서. 상세정보·배송·교환 내용이 아래로 이어지고 상단 탭을 누르면 해당 영역으로 스크롤
- 3D: 관리자에서 등록한 CAD의 GLB 뷰어와 상품 상세정보 왼쪽의 3D 탭. 드래그·확대·자동 회전·시점 전환 지원. `902-0209-000`에 CAD가 없으면 공식 사진과 D80 × 100.1mm 외형 비율을 참고한 기존 간략 모델 표시
- 관리자: 헤더의 관리자 페이지 버튼으로 진입. 왼쪽 메뉴와 오른쪽 작업 화면으로 구성하며, 요청에 따라 별도 인증 없이 사용
- 메인관리: 구좌 추가·삭제, 타이틀·서브타이틀·노출 상품 수 편집, 상품 선택·제외·순서 변경. 저장하면 메인에 반영되며 모든 구좌를 삭제한 상태도 저장 가능
- 상품관리: AG Grid Community 기반 정렬·필터·페이지네이션·체크박스 선택, 상품 ID를 통한 수정, 신규 등록 및 선택 삭제
- Zustand: 페이지 이동 중 유지되는 모의 장바구니·관심상품, 모의 문의 알림
- 폰트: 자체 호스팅하는 Google Sans, 한글 글리프용 Noto Sans KR Variable 보완. 스토어 전체 글자 크기를 최초 구현보다 총 3px 확대하고 관리자 글자 크기는 별도로 유지

실제 주문·결제·문의 전송은 수행하지 않습니다. `robotis.com` 및 `www.robotis.com`으로 향하는 기존 메뉴·배너·자료 링크는 이동 대신 “준비 중인 기능입니다.” 알림을 표시합니다. 내부 상품 페이지와 `docs.robotis.com`·GitHub 등 다른 도메인의 자료 링크는 유지합니다.

## 데이터 저장 및 조회

대상은 `robotis-shop` 프로젝트의 기본 `(default)` Firestore입니다. 서비스 계정으로 확인한 edition은 Standard이며 리전은 `asia-northeast3`입니다.

```dotenv
NEXT_PUBLIC_FIREBASE_PROJECT_ID=robotis-shop
FIREBASE_ADMIN_KEY_PATH=./robotis-shop-firebase-adminsdk.json
```

`.env.local`에 위 서버 인증 경로를 설정합니다. 서비스 계정 JSON과 `.env.local`은 Git 제외 대상입니다. 브라우저의 공개 웹 설정과 서버 인증 키는 별개입니다.

### Vercel의 서버 전용 Secret 설정

Vercel 프로젝트의 **Settings → Environment Variables**에 다음 두 값을 등록합니다.

| 이름 | 값 | 타입 |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `robotis-shop` | Config |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` | 로컬 서비스 계정 JSON 파일의 전체 내용 | Secret |

배포할 환경(Production, 필요하면 Preview)을 선택하고 저장한 뒤 재배포합니다. JSON은 Base64로 변환하거나 추가 따옴표로 감싸지 않고 파일 내용 그대로 등록합니다. `private_key` 안의 `\n`도 그대로 유지합니다. 비공개 키가 포함된 값에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

Vercel에는 `FIREBASE_ADMIN_KEY_PATH`를 등록할 필요가 없습니다. 앱과 데이터 스크립트는 JSON 환경변수를 우선 사용하고, 값이 비어 있을 때만 로컬 인증 파일을 읽습니다. 잘못된 JSON은 파일 인증으로 우회하지 않고 오류를 반환하며 인증값을 오류 메시지에 포함하지 않습니다.

이 설정은 Firestore 인증을 위한 것입니다. 현재 STEP 변환에 사용하는 Blender·Open CASCADE와 영구 파일 저장소는 Vercel에 그대로 배포할 수 없으며, 아래 CAD 변환 절의 별도 서버·저장소 구성이 필요합니다.

화면은 `src/lib/shop-data.ts`의 Firebase Admin SDK 조회 결과로 렌더링됩니다. `data/catalog.json`을 읽는 것은 가져오기 스크립트뿐이며, 앱은 이 파일을 로컬 대체 데이터로 사용하지 않습니다. 요청 내 중복 조회만 React `cache`로 합치고, 세 페이지는 `force-dynamic`으로 최신 DB 내용을 읽습니다.

관리자 저장은 Server Actions에서 입력을 검증한 뒤 같은 Firestore에 기록하고 Next.js 캐시를 갱신합니다. 같은 브라우저·출처에서 열어 둔 스토어 탭은 BroadcastChannel 알림을 받아 새 데이터를 조회합니다. 상품 삭제는 복구할 수 있도록 문서를 보관하고 `deleted: true`, `published: false`로 전환하며, 메인 구좌의 상품 연결도 같은 트랜잭션에서 제거합니다. 삭제 상품은 관리자의 상태 검색에서 조회하고 상세 화면에서 저장해 복구할 수 있습니다.

상품 이미지는 URL로 등록합니다. 기존 `/media/` 이미지, ROBOTIS의 `/data/` 이미지, Firebase Storage 및 Google Cloud Storage의 HTTPS 이미지 URL을 지원합니다.

| 저장 위치 | 용도 |
| --- | --- |
| `products/{원본 상품코드}` | 상품명·실제 가격·사진·갤러리·카테고리·스펙·설명·관련 링크 |
| `banners/{hero-N}` | 배너·모바일 이미지·선택 탭 이미지·대상 상품 또는 카테고리·노출 순서 |
| `siteContent/home` | 메뉴, 메인 구좌별 타이틀·서브타이틀·노출 수·상품 ID와 순서, 로고, 원본 배송·교환 안내 |
| `modelAssets/{UUID}` | 변환된 GLB의 파일명·용량·삼각형 수·원본 외형 치수·Blender 버전 |

수집 범위는 지정한 메인과 다이나믹셀-Y 목록에 노출된 상품 및 배너가 연결하는 단일 상품입니다. 상품 30개와 배너 8개를 저장했습니다. 원본 전체 쇼핑몰을 수집한 것은 아닙니다. 수집하지 않은 카테고리는 빈 상태를 표시합니다.

## 크롤링과 재저장

```powershell
npm run data:crawl
npm run data:import
```

크롤러는 실제 상품 상세 페이지에서 데이터를 추출하고 주요 이미지·배너를 `public/media`에 보관합니다. 공식 긴 상세 이미지와 추가 갤러리는 원본 URL을 저장합니다. 데이터에는 `sourceUrl`, `sourceUpdatedAt`을 보존합니다. 원본 HTML은 앱에서 실행하거나 그대로 삽입하지 않습니다.

가져오기는 원본 상품코드와 배너 ID를 사용하므로 중복 문서를 만들지 않습니다. `merge`로 추가 필드를 보존하지만, 수집 대상 필드의 값은 최신 원본으로 덮어씁니다. 이후 관리자에서 해당 필드를 직접 수정한 경우 재가져오기 전에 변경 범위를 확인해야 합니다. `published: false`인 상품·배너는 화면에서 제외됩니다.

소규모 상품 목록은 Firestore에서 공개 상품을 읽은 뒤 브라우저에서 즉시 필터·정렬합니다. 상품 수가 늘어나면 카테고리별 서버 쿼리와 커서 페이지네이션으로 확장할 수 있습니다. 현재 조회에는 복합 인덱스가 필요하지 않습니다. 기존 Security Rules는 변경하지 않았습니다.

상품의 `model3d` 필드에 CAD 모델이 연결되면 해당 GLB를 React Three Fiber로 표시합니다. 모델이 없는 `902-0209-000`에는 기존 간략 모델을 표시하고, 다른 상품은 모델 등록 시 3D 탭을 표시합니다. 3D 영역이 화면에 들어올 때 엔진을 로드하며, 화면 밖·숨겨진 탭·회전 정지 상태에서는 상시 렌더링을 멈춥니다. 모션 축소 설정 시 자동 회전을 시작하지 않으며 WebGL 미지원 시 대체 안내를 표시합니다.

## STEP CAD 업로드 및 변환

Python 3.12와 pip가 필요합니다. 처음 한 번 서버 PC에서 다음 명령을 실행합니다.

```powershell
npm run cad:setup
```

Windows에서는 프로젝트 전용 `.venv-cad`에 Open CASCADE를 설치하고, Blender 4.5 LTS 공식 배포본을 SHA-256 검증 후 `.tools`에 설치합니다. 다른 운영체제에서는 Blender를 별도로 설치하고 `BLENDER_PATH`를 지정합니다. 기존 도구를 사용할 때는 `.env.local`에 `CAD_PYTHON_PATH`, `BLENDER_PATH`를 절대 경로로 지정합니다. Python 환경에는 `scripts/cad/requirements.txt`의 패키지가 필요합니다.

1. 관리자 상품 등록·수정 화면의 **3D CAD 모델**에서 `.step` 또는 `.stp` 파일을 선택합니다.
2. **STEP 파일 변환**을 누릅니다. 로컬은 최대 50MB, Vercel에서 원격 변환할 때는 업로드 제한을 고려해 최대 4MB입니다. 복잡한 모델은 변환에 수 분이 걸릴 수 있습니다.
3. 변환 완료 후 **상품 저장**을 누르면 해당 상품 상세에 3D 뷰어가 표시됩니다. **연결 해제**도 상품을 저장해야 반영됩니다.

Open CASCADE가 CAD 곡면을 메시로 만들고 Blender가 중심·크기·표면을 정리해 GLB로 내보냅니다. 큰 메시는 최대 약 30만 삼각형을 목표로 줄이며, GLB는 최대 32MB입니다. 원본의 색상·부품 계층 대신 밝은 단일 재질로 외관을 표현합니다. 프론트의 짙은 배경·측면 조명·바닥 그림자가 밝은 모델의 윤곽과 구멍을 구분해 줍니다. 원본 치수는 mm로 보관하고 화면 표시 크기만 정규화합니다.

파일은 기본적으로 `.data/models/{UUID}`에 보관하며 `CAD_STORAGE_PATH`로 저장 위치를 변경할 수 있습니다. 원본 STEP과 GLB는 서버 파일시스템에, 메타데이터와 상품 연결은 Firestore에 저장합니다. 새 모델 변환이 실패해도 기존 상품의 연결은 바뀌지 않습니다. 연결 해제한 모델과 원본은 보관됩니다.

이 기능은 Blender 프로세스를 실행할 수 있는 Node.js 서버와 영구 저장소가 필요합니다. 서버 이전 시 `.data/models`도 함께 옮기거나 같은 `CAD_STORAGE_PATH`를 연결해야 합니다. Edge 런타임 및 임시 파일시스템만 제공하는 서버리스 환경에서는 별도 변환 서버·파일 저장소가 필요합니다.

### Cloud Run CAD API 배포

저장소 루트의 `Dockerfile`은 쇼핑몰이 아닌 CAD 변환 API 전용입니다. 기존 Vercel 쇼핑몰 배포와 함께 같은 저장소를 사용합니다. `.dockerignore`가 필요한 CAD 소스만 허용하므로 Firebase 인증키, `.env.local`, 로컬 모델과 도구는 이미지에 포함되지 않습니다. Blender 4.5.15 Linux 배포본은 공식 SHA-256 값으로 검증합니다.

Cloud Run의 저장소 빌드 설정은 다음과 같습니다.

| 항목 | 값 |
| --- | --- |
| 저장소 / 브랜치 | `evvae-dev/robotis-shop` / `main` |
| 빌드 방식 | Dockerfile |
| Dockerfile 경로 | `Dockerfile` (저장소 루트) |
| 빌드 컨텍스트 | `.` (저장소 루트) |
| 컨테이너 포트 | `8080` |
| 결제 / 확장 | 요청 기반 / 자동 확장 |
| 최소 / 최대 인스턴스 | `0` / `1` |
| CPU / 메모리 | 시작값 `1 vCPU` / `2 GiB`, 큰 모델은 실제 사용량 확인 후 조정 |
| 컨테이너당 최대 동시 요청 | `1` |
| 요청 제한 시간 | `420`초 |

포트폴리오의 요청에 따라 Cloud Run API는 토큰 검사 없이 실행합니다. `CAD_API_TOKEN`은 사용하지 않습니다. Cloud Run의 공개 액세스를 허용해야 Vercel에서 호출할 수 있습니다. 공개된 변환 API의 외부 호출도 사용량에 포함됩니다.

- `GET /health`: `{"status":"ok","service":"robotis-cad"}` 응답.
- `POST /convert`: multipart `file` 필드의 STEP/STP 파일을 받습니다. Cloud Run HTTP/1 요청 크기 제한을 고려해 API 자체 입력은 최대 30MB이며, Vercel을 경유하는 관리자 업로드는 최대 4MB입니다.
- 성공 시 GLB 바이너리를 반환합니다. `X-CAD-Metadata` 헤더는 치수·삼각형 수·Blender 버전 JSON을 Base64로 인코딩한 값입니다. GLB는 최대 32MB이며 응답 후 임시 파일을 제거합니다.

Vercel의 서버 전용 환경변수에 다음 값을 설정한 뒤 재배포합니다. 로컬 `.env.local`에서는 두 값을 비워 기존 Blender 변환과 로컬 파일 저장을 유지합니다.

| 환경변수 | 값 |
| --- | --- |
| `CAD_API_URL` | `https://robotis-shop-git-610142854589.asia-northeast3.run.app` (`/convert` 제외) |
| `CAD_STORAGE_BUCKET` | STEP 원본과 GLB를 영구 저장할 Cloud Storage 버킷 이름 (`gs://` 제외) |

버킷은 Firebase 프로젝트의 기본 버킷일 필요가 없습니다. 기존 Cloud Run 프로젝트에 별도로 생성한 비공개 Google Cloud Storage 버킷을 사용할 수 있습니다. Vercel의 Firebase 서비스 계정에는 해당 버킷의 객체 목록 조회·읽기·쓰기·삭제 권한이 필요합니다. 버킷 단위로 `Storage Object Admin` 역할을 부여하면 됩니다. 버킷 전체를 공개하거나 브라우저에 서비스 계정 키를 전달하지 않습니다.

관리자는 Vercel의 `/api/admin/models`로 파일을 올리고, Vercel은 Cloud Run의 `/convert`를 호출합니다. 원본과 GLB를 버킷에 저장한 뒤 Firestore `modelAssets`에 저장 위치를 기록합니다. 상품 저장 방식은 기존과 같으며 상품상세의 `/api/models/{UUID}`가 비공개 버킷의 GLB를 스트리밍합니다. 기존 로컬 모델은 계속 로컬 파일에서 읽습니다. API 응답은 최대 270초 기다리며, 저장소 설정이 없으면 변환을 시작하기 전에 오류를 반환합니다.

최소 인스턴스가 0이어도 요청 처리, Cloud Build, Artifact Registry 이미지 저장과 네트워크 사용량에는 무료 한도 초과 요금이 발생할 수 있습니다. 최대 인스턴스 1은 비용 상한이 아닙니다.

## 소스 구조

```text
src/app/(store)/page.tsx                 # 메인
src/app/(store)/products/page.tsx        # 상품 목록
src/app/(store)/products/[productId]/page.tsx # 상품 상세
src/app/admin/                          # 관리자 전용 레이아웃과 화면
src/app/globals.css                      # 공통·페이지·반응형 스타일
src/components/layout/                   # 원본 기반 헤더·푸터
src/features/admin/                     # 관리자 UI·검증 스키마·Server Actions
src/features/landing/components/         # 메인 배너
src/features/products/components/        # 상품 카드·목록·상세
src/features/cart/store/                 # Zustand 모의 상태
src/lib/firebase/admin.ts                # 서버 전용 인증
src/lib/shop-data.ts                     # Firestore 조회
scripts/crawl-catalog.mjs                # 지정 범위 크롤러
scripts/import-catalog.mjs               # Firestore 가져오기 및 재조회 검증
scripts/setup-cad.mjs                    # CAD 변환 도구 설치
scripts/cad/                             # STEP 메시화·Blender GLB 내보내기
src/app/api/admin/models/route.ts        # STEP 업로드 및 변환
src/app/api/models/[modelId]/route.ts    # GLB 파일 제공
```

## 검증

```powershell
npm run typecheck
npm run build
npm start
```

브라우저 검증은 메인 구성·배너 전환·목록 정렬·필터·빈 결과·이미지 전환·수량 합계·모의 장바구니·상세 영역 스크롤 및 관리자 저장 동작을 대상으로 합니다. PC와 모바일 레이아웃을 각각 확인합니다.

폰트 라이선스는 `public/fonts/Google-Sans-OFL.txt`와 `@fontsource-variable/noto-sans-kr/LICENSE`에 포함되어 있습니다. 상품 및 배너 이미지의 출처는 [ROBOTIS 공식 스토어](https://www.robotis.com/shop/)입니다.
