"""실제 실행 화면과 코드 검증 내용을 기반으로 포트폴리오 PDF를 생성합니다."""
from pathlib import Path
from xml.sax.saxutils import escape
import json

from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parent
SHOTS = ROOT / "screenshots"
OUTPUT = ROOT.parents[2] / "output" / "pdf" / "ROBOTIS_Store_Portfolio.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
W, H = landscape(A4)
INK = HexColor("#172637")
NAVY = HexColor("#17283D")
MUTED = HexColor("#65768B")
LIGHT = HexColor("#F2F5F8")
LINE = HexColor("#DFE5EB")
YELLOW = HexColor("#F1D13C")
BLUE = HexColor("#345D89")
TEAL = HexColor("#337E72")
pdfmetrics.registerFont(TTFont("KR", "C:/Windows/Fonts/malgun.ttf"))
pdfmetrics.registerFont(TTFont("KR-Bold", "C:/Windows/Fonts/malgunbd.ttf"))
pdfmetrics.registerFontFamily("KR", normal="KR", bold="KR-Bold", italic="KR", boldItalic="KR-Bold")
c = canvas.Canvas(str(OUTPUT), pagesize=(W, H), pageCompression=1)
c.setTitle("ROBOTIS 스토어 고도화 포트폴리오")
c.setAuthor("")
c.setSubject("프론트엔드, 관리자 운영, STEP CAD 변환과 3D 제품 뷰어")
checks = []
page = 0


def rect(x, y, width, height, color, stroke=None, radius=0):
    c.setFillColor(color)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(0.6)
    if radius:
        c.roundRect(x, H-y-height, width, height, radius, fill=1, stroke=int(bool(stroke)))
    else:
        c.rect(x, H-y-height, width, height, fill=1, stroke=int(bool(stroke)))


def text(x, y, value, size=10, color=INK, bold=False):
    c.setFont("KR-Bold" if bold else "KR", size)
    c.setFillColor(color)
    c.drawString(x, H-y-size, value)


def para(x, y, width, value, size=10.5, leading=None, color=INK, bold=False, max_h=None):
    style = ParagraphStyle("p", fontName="KR-Bold" if bold else "KR", fontSize=size,
                           leading=leading or size*1.65, textColor=color, wordWrap="CJK",
                           spaceBefore=0, spaceAfter=0)
    p = Paragraph(value, style)
    _, height = p.wrap(width, 1000)
    if max_h is not None and height > max_h + .1:
        raise ValueError(f"문단 높이 초과: {height:.1f}>{max_h}: {value}")
    if x < 0 or x+width > W+.1 or y+height > H-37:
        raise ValueError(f"문단이 페이지 영역을 벗어납니다: {value}")
    p.drawOn(c, x, H-y-height)
    checks.append({"page": page, "top": y, "height": round(height, 1), "text": value})
    return height


def footer(dark=False):
    color = HexColor("#8FA3B9") if dark else MUTED
    c.setStrokeColor(HexColor("#3B4C60") if dark else LINE)
    c.setLineWidth(.5)
    c.line(42, 36, W-42, 36)
    text(42, H-25, "ROBOTIS STORE  /  독립 포트폴리오 프로젝트", 7.5, color)
    text(W-153, H-25, f"2026.10    {page:02d} / 13", 7.5, color)


def begin(section, title, subtitle="", dark=False):
    global page
    page += 1
    rect(0, 0, W, H, NAVY if dark else white)
    rect(42, 32, 25, 3, YELLOW)
    text(79, 27, section, 8.5, HexColor("#91A6BE") if dark else MUTED, True)
    if title:
        para(42, 60, W-84, title, 24.5, 33, white if dark else INK, True, max_h=66)
    if subtitle:
        para(43, 104, W-86, subtitle, 10, 15.5, HexColor("#B6C4D4") if dark else MUTED, max_h=31)


def finish(dark=False):
    footer(dark)
    c.showPage()


def screenshot(name, x, y, width, height=None, crop=None, frame=True):
    image = Image.open(SHOTS / name).convert("RGB")
    if crop:
        if not (0 <= crop[0] < crop[2] <= image.width and 0 <= crop[1] < crop[3] <= image.height):
            raise ValueError(f"캡처 범위 오류: {name}, {crop}, {image.size}")
        image = image.crop(crop)
    image_h = width * image.height / image.width
    if height is not None and image_h > height:
        width = height * image.width / image.height
        image_h = height
    if y+image_h > H-39:
        raise ValueError(f"이미지가 페이지 영역을 벗어납니다: {name}, {y+image_h}")
    if frame:
        rect(x-1, y-1, width+2, image_h+2, white, LINE)
    c.drawImage(ImageReader(image), x, H-y-image_h, width, image_h, mask="auto")
    return width, image_h


def notes(items, x=665, y=166, width=132, gap=119):
    for index, (heading, body) in enumerate(items):
        top = y+gap*index
        rect(x, top, 26, 22, YELLOW, radius=3)
        text(x+6, top+3, f"{index+1:02d}", 9, INK, True)
        para(x, top+33, width, heading, 11.3, 16, INK, True, max_h=34)
        para(x, top+61, width, body, 9.3, 15, MUTED, max_h=61)


def arrow(x1, y1, x2, y2, color=BLUE):
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.2)
    c.line(x1, H-y1, x2, H-y2)
    p = c.beginPath()
    if abs(x2-x1) >= abs(y2-y1):
        direction = 1 if x2 >= x1 else -1
        p.moveTo(x2, H-y2)
        p.lineTo(x2-direction*6, H-y2+3)
        p.lineTo(x2-direction*6, H-y2-3)
    else:
        direction = 1 if y2 >= y1 else -1
        p.moveTo(x2, H-y2)
        p.lineTo(x2-3, H-y2+direction*6)
        p.lineTo(x2+3, H-y2+direction*6)
    p.close()
    c.drawPath(p, fill=1, stroke=0)


def box(x, y, width, height, title, body, dark=False):
    rect(x, y, width, height, NAVY if dark else LIGHT, radius=5)
    text(x+15, y+12, title, 11.5, white if dark else INK, True)
    para(x+15, y+35, width-30, body, 9.4, 14.5, HexColor("#C4D1DF") if dark else MUTED, max_h=height-42)


# 01. 표지: 실제 메인 화면을 사용하고 개인 정보는 넣지 않습니다.
begin("PROJECT PORTFOLIO", "", dark=True)
text(42, 82, "ROBOTIS STORE", 15, YELLOW, True)
text(42, 108, "RE-ENGINEERING", 11, HexColor("#B9C8DA"))
para(42, 163, 295, "제품 탐색에서<br/>CAD 3D 확인까지", 27, 39, white, True, max_h=80)
para(43, 277, 272, "기존 스토어의 구조를 존중하면서<br/>고객의 제품 선택과 관리자의 운영을<br/>하나의 데이터 흐름으로 연결한 웹 애플리케이션.", 11, 20, HexColor("#B9C8DA"), max_h=81)
screenshot("home-desktop.png", 357, 84, 441, crop=(80, 0, 1360, 960), frame=False)
text(358, 426, "실제 실행 화면 · 메인", 8, HexColor("#9DB0C6"))
rect(42, 466, W-84, 69, HexColor("#24374E"), radius=5)
for x, label, body in [(60, "STORE", "메인 · 목록 · 상세"), (311, "ADMIN", "구좌 · 상품 · CAD 관리"), (561, "CAD TO WEB", "STEP → GLB → R3F")]:
    text(x, 480, label, 9, YELLOW, True)
    text(x, 504, body, 11, white)
finish(True)

# 02. 문제 정의와 구현 범위를 명확히 분리합니다.
begin("01 / PROJECT BRIEF", "익숙한 구조 위에, 새로운 사용 흐름을 얹다", "공개 스토어를 기준으로 고객 화면과 운영 도구를 함께 구성한 포트폴리오 프로젝트입니다.")
metrics = [("30", "수집한 상품"), ("8", "수집한 배너"), ("4", "운영 가능한 메인 구좌"), ("3", "고객용 핵심 화면")]
for i, (value, label) in enumerate(metrics):
    x = 42+i*194
    rect(x, 151, 176, 91, LIGHT, radius=5)
    text(x+16, 158, value, 29, INK, True)
    text(x+17, 207, label, 10, MUTED)
for x, title, body in [
    (42, "유지할 것", "로고, 상단 메뉴, 카테고리, 배너와 기존 메인 구성을 유지해 브랜드의 익숙함을 보존합니다."),
    (302, "개선할 것", "상품 카드와 정렬·필터, 상세 사양과 자료의 정보 계층을 다듬어 제품을 비교하기 쉽게 구성합니다."),
    (562, "연결할 것", "관리자 편집을 Firestore에 저장하고, STEP CAD를 웹용 3D 모델로 연결해 콘텐츠 운영을 확장합니다."),
]:
    text(x, 278, title, 15, INK, True)
    rect(x, 309, 31, 3, YELLOW)
    para(x, 328, 228, body, 11, 18.5, MUTED, max_h=95)
rect(42, 454, W-84, 74, NAVY, radius=5)
text(58, 466, "IMPLEMENTED STACK", 8.5, YELLOW, True)
para(58, 486, W-116, "Next.js 14 App Router · React · TypeScript · Tailwind CSS · Firebase Firestore · Zustand<br/>React Three Fiber / Drei / Three.js · AG Grid Community · Open CASCADE · Blender", 9.5, 17, white, max_h=35)
finish()

# 03. 메인
begin("02 / STOREFRONT", "브랜드의 익숙함을 유지한 메인", "전면 재해석보다 기존 정보 구조의 보존을 우선하고, 실제 상품·배너 데이터로 화면을 구성했습니다.")
screenshot("home-desktop.png", 42, 141, 598, 405, crop=(80, 0, 1360, 880))
notes([
    ("기존 구성 유지", "로고·메뉴·좌측 카테고리·메인 배너의 관계를 그대로 가져왔습니다."),
    ("실제 데이터 사용", "공개 상품과 배너를 수집하고 Firestore에서 조회해 렌더링합니다."),
    ("운영 가능한 구좌", "신제품·추천액츄에이터·교육키트·벌크 상품을 관리자에서 편집합니다."),
], gap=122)
finish()

# 04. 목록
begin("03 / PRODUCT DISCOVERY", "제품 사양을 기준으로 좁혀 가는 탐색", "카테고리와 사양 필터, 정렬, 상품 카드의 역할을 분리해 비교할 정보를 빠르게 찾도록 구성했습니다.")
screenshot("catalog-focused.png", 42, 143, 598, 403, crop=(80, 30, 1360, 900))
notes([
    ("사양 필터", "시리즈·통신 방식·토크 조건을 조합하고 선택 조건을 칩으로 확인합니다."),
    ("정렬의 예외 처리", "가격·상품명 정렬을 지원하고 가격이 없는 견적 상품은 가격순의 뒤로 보냅니다."),
    ("비교 중심 카드", "제품 사진, 모델명, 핵심 사양, 가격을 같은 계층으로 배치했습니다."),
], gap=122)
finish()

# 05. 상세 상단
begin("04 / PRODUCT DETAIL", "사진과 핵심 정보를 구매 검토의 시작점으로", "갤러리와 가격·수량 영역을 명확히 나누고, 실제 상품 데이터에 모의 장바구니 흐름을 연결했습니다.")
screenshot("detail-desktop.png", 42, 150, 598, 382, crop=(80, 200, 1360, 970))
notes([
    ("제품 이미지 갤러리", "공식 제품 사진을 여러 각도에서 확인하고 썸네일로 전환합니다."),
    ("수량과 합계", "선택 수량에 맞춰 합계를 계산하며 장바구니·관심상품은 Zustand로 관리합니다."),
    ("모의 구매 흐름", "실제 결제·주문·문의 전송 없이 인터랙션을 확인할 수 있는 프로토타입입니다."),
], gap=122)
finish()

# 06. 상세 정보: 실제 캡처의 빈 공간만 덜어 가독성을 높입니다.
begin("05 / INFORMATION DESIGN", "사양에서 개발 자료까지, 끊기지 않는 읽기 흐름", "3D·상세정보·배송·교환 내용을 세로로 연결하고, 탭 클릭은 해당 영역으로 스크롤되도록 구현했습니다.")
screenshot("detail-specifications.png", 71, 130, 700, crop=(100, 0, 1340, 75))
screenshot("detail-specifications.png", 71, 181, 700, crop=(100, 185, 1340, 825))
text(73, 546, "상품 상세정보의 탭·사양·개발 자료 영역 발췌. 모든 구간은 한 페이지에 연속으로 표시됩니다.", 7.7, MUTED)
finish()

# 07. R3F CAD
begin("06 / INTERACTIVE 3D", "흰 CAD 모델의 형상을 읽을 수 있는 3D 뷰어", "실제 STEP 변환 검증 화면입니다. 짙은 배경과 측면 조명, 바닥 그림자로 윤곽과 구멍을 구분합니다.")
screenshot("cad-viewer.png", 42, 144, 756, crop=(100, 285, 1340, 855))
for x, heading, body in [
    (42, "형상 확인", "드래그 회전 · 확대 · 정면/상단 시점"),
    (302, "표시 성능", "영역 진입 시 로드 · 비활성 시 상시 렌더 중지"),
    (562, "대체 경로", "모션 축소 반영 · WebGL 미지원 안내"),
]:
    text(x, 510, heading, 10.5, INK, True)
    para(x, 532, 239, body, 8.8, 13.5, MUTED, max_h=18)
finish()

# 08. 메인관리
begin("07 / CONTENT OPERATIONS", "운영자가 직접 편집하는 메인 구좌", "타이틀·서브타이틀·노출 상품 수·배치 순서를 관리하고, 저장 결과를 스토어에 반영합니다.")
screenshot("admin-main.png", 42, 132, 756, crop=(0, 140, 1440, 940))
finish()

# 09. 상품관리
begin("08 / PRODUCT OPERATIONS", "검색부터 등록·수정·선택 삭제까지", "AG Grid Community로 정렬·필터·페이지네이션·체크박스 선택을 제공하고, 상품 ID를 상세 편집 화면에 연결했습니다.")
screenshot("admin-products-selected.png", 42, 132, 756, crop=(0, 150, 1440, 940))
finish()

# 10. CAD 파이프라인
begin("09 / CAD PUBLISHING", "관리자의 STEP 업로드를 웹 콘텐츠로 전환", "변환과 상품 반영을 구분해, 새 CAD의 변환이 실패해도 기존 상품 모델이 바뀌지 않도록 구성했습니다.")
screenshot("admin-cad.png", 42, 150, 505, crop=(255, 280, 1105, 730))
text(44, 426, "실제 CAD 변환 예제: GLB 2.87MB · 90,276개 삼각형", 8.4, MUTED)
for i, (value, label) in enumerate([("50MB", "STEP 업로드 제한"), ("32MB", "GLB 결과 제한"), ("상품 저장", "변환 모델 연결 시점")]):
    x = 42+i*173
    rect(x, 456, 159, 78, LIGHT, radius=4)
    text(x+12, 465, value, 18 if i < 2 else 15, INK, True)
    text(x+12, 506, label, 8.5, MUTED)
steps = [("01  STEP / STP", "원본 파일 확인"), ("02  Open CASCADE", "CAD 곡면을 삼각형 메시로 변환"), ("03  Blender", "중심·크기·재질 정리 후 GLB 내보내기"), ("04  R3F Viewer", "상품에 연결된 모델을 브라우저에서 표시")]
for i, (title, body) in enumerate(steps):
    top = 150+i*78
    box(590, top, 208, 61, title, body, dark=i == 2)
    if i < 3:
        arrow(694, top+63, 694, top+75)
para(590, 475, 208, "원본·GLB는 서버 파일시스템에,<br/>메타데이터·상품 연결은 Firestore에 저장합니다.", 9.5, 16, MUTED, max_h=50)
finish()

# 11. 구조도와 설계 판단
begin("10 / ARCHITECTURE", "화면·데이터·변환 작업의 책임을 나누다", "고객 화면과 관리자 레이아웃을 분리하고, 서버에서 데이터를 검증한 뒤 같은 Firestore를 읽고 씁니다.")
text(42, 150, "INTERFACE", 8.5, MUTED, True)
text(282, 150, "NEXT.JS SERVER", 8.5, MUTED, True)
text(575, 150, "DATA & ASSETS", 8.5, MUTED, True)
box(42, 179, 188, 89, "고객 화면", "메인 · 상품 목록 · 상품 상세<br/>Zustand 모의 상태 · R3F 뷰어")
box(42, 292, 188, 89, "관리자 화면", "메인 구좌 · 상품 CRUD<br/>STEP 업로드 · 변환 결과 연결")
box(282, 179, 237, 65, "Server Components", "요청별 Firestore 조회 · 필요한 필드 직렬화")
box(282, 266, 237, 65, "Server Actions", "Zod 검증 · 트랜잭션 저장 · 화면 갱신")
box(282, 353, 237, 65, "CAD Route Handler", "Open CASCADE · Blender 프로세스 실행", True)
box(575, 179, 223, 132, "Firestore", "products · banners<br/>siteContent / home · modelAssets<br/>상품 정보·구좌·모델 메타데이터")
box(575, 349, 223, 75, "영구 파일 저장소", "원본 STEP · 변환 GLB<br/>모델 ID 기반 조회")
arrow(231, 220, 278, 212)
arrow(231, 324, 278, 298)
arrow(231, 360, 278, 385)
arrow(520, 211, 571, 211)
arrow(520, 299, 571, 276)
arrow(520, 386, 571, 384)
for x, title, body in [
    (42, "데이터 일관성", "삭제 상태와 메인 상품 연결 해제를 같은 트랜잭션에서 처리합니다."),
    (302, "열린 화면 갱신", "저장 후 캐시를 갱신하고 같은 브라우저의 스토어 탭에 갱신 신호를 보냅니다."),
    (562, "로딩 비용 분리", "3D 엔진은 영역 진입 시 로드하고 작은 상품 목록은 클라이언트에서 필터링합니다."),
]:
    text(x, 451, title, 11, INK, True)
    para(x, 475, 232, body, 9.5, 15.8, MUTED, max_h=65)
finish()

# 12. 모바일 캡처와 검증
begin("11 / RESPONSIVE & VALIDATION", "작은 화면에서도 이어지는 탐색과 구매 검토", "PC 1440×1000과 모바일 390×844에서 실제 화면을 캡처하고 주요 인터랙션을 확인했습니다.")
for x, name, label in [(46, "home-mobile.png", "메인 · 배너와 메뉴"), (232, "catalog-mobile.png", "목록 · 모바일 필터"), (418, "detail-mobile.png", "상세 · 수량과 모의 담기")]:
    rect(x-4, 143, 177, 375, HexColor("#E4E9EF"), radius=9)
    screenshot(name, x, 148, 169, frame=False)
    text(x, 530, label, 8.3, MUTED)
rect(615, 143, 183, 375, NAVY, radius=6)
text(632, 159, "검증한 항목", 14, white, True)
for top, title, body in [
    (203, "빌드·타입 검사", "프로덕션 빌드와 TypeScript 검사 통과"),
    (278, "운영 동작", "등록·수정·구좌 저장·삭제 연결 해제 확인"),
    (353, "CAD 변환", "정상 변환·손상 파일 실패·기존 연결 유지 확인"),
    (428, "브라우저 화면", "캡처 시나리오에서 콘솔·페이지 오류 없음"),
]:
    rect(632, top+5, 4, 4, YELLOW)
    text(644, top, title, 9.5, white, True)
    para(644, top+23, 137, body, 8.5, 14, HexColor("#BECCDC"), max_h=44)
finish()

# 13. 실제 범위와 다음 과제를 숨기지 않습니다.
begin("12 / OUTCOME & NEXT STEPS", "제품 이해와 콘텐츠 운영을 함께 설계하다", "화면 개선에서 끝내지 않고 제품 데이터, 운영 도구, CAD 기반 3D 표시까지 하나의 흐름으로 연결했습니다.")
for top, title, body in [
    (159, "01  제품의 맥락을 UI에 반영", "제품 사진·모델명·토크·통신 방식·개발 자료를 중심으로 탐색과 상세 정보의 계층을 정리했습니다."),
    (270, "02  콘텐츠를 운영할 수 있는 구조", "상품과 메인 구좌를 Firestore로 관리하고, 운영 변경이 실제 스토어 화면에 반영되도록 연결했습니다."),
    (381, "03  CAD 자산을 웹으로 연결", "STEP을 GLB로 변환하는 서버 파이프라인과 R3F 뷰어를 구성해 제품 형상 확인을 지원했습니다."),
]:
    text(42, top, title, 13, INK, True)
    para(42, top+33, 352, body, 10.4, 18, MUTED, max_h=64)
rect(440, 150, 358, 321, LIGHT, radius=6)
text(458, 168, "상용 전환 전에 보완할 범위", 13, INK, True)
for top, title, body in [
    (212, "관리자 인증·권한·감사 로그", "현재는 포트폴리오 테스트 조건으로 무인증입니다."),
    (271, "비동기 변환 작업과 파일 저장", "작업 큐·별도 변환 워커·객체 저장소로 확장합니다."),
    (330, "조회 범위와 구매 기능", "대량 상품의 서버 페이지네이션과 실제 주문·결제는 별도 구현 대상입니다."),
    (403, "사용성·성능 지표", "구매 전환율과 LCP·INP 개선 수치는 측정하지 않았습니다. 계측 후 검증이 필요합니다."),
]:
    text(459, top, title, 10.5, INK, True)
    para(459, top+20, 318, body, 9.2, 15.5, MUTED, max_h=40)
para(43, 492, W-86, "ROBOTIS 비공식 개인 포트폴리오입니다. 상표·제품명·제품 이미지·공개 CAD 자료의 출처는 ROBOTIS 공식 스토어와 e-Manual입니다. 스토어·관리자 이미지는 실제 로컬 실행 화면이며, CAD 이미지는 변환 검증용 상품으로 촬영했습니다. 수집 범위는 상품 30개·배너 8개이며, 실제 주문·결제·문의 전송은 포함하지 않습니다.", 8.3, 13.5, MUTED, max_h=56)
finish()

if page != 13:
    raise ValueError("예상 페이지 수와 다릅니다.")
c.save()
(ROOT / "layout-checks.json").write_text(json.dumps({"pages": page, "paragraphs": checks}, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"output": str(OUTPUT), "pages": page, "bytes": OUTPUT.stat().st_size}, ensure_ascii=False))
