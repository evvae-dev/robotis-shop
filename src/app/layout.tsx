import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-kr";
import "./globals.css";


export const metadata: Metadata = {
  title: { default: "ROBOTIS shop — 로보티즈 온라인 스토어", template: "%s | ROBOTIS shop" },
  description: "다이나믹셀, 전문가용 로봇, 로봇부품, 스팀컵인증키트. ROBOTIS 온라인 스토어 포트폴리오입니다.",
};

// 폰트·메타데이터만 공유하고 스토어와 관리자의 레이아웃은 라우트 그룹에서 분리합니다.
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head><link rel="stylesheet" href="/fonts/google-sans.css" /></head>
      <body>
        {children}
      </body>
    </html>
  );
}
