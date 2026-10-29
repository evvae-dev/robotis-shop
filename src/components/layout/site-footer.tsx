import Link from "next/link";
import { StoreLink } from "@/components/ui/store-link";
import { Icon } from "@/components/ui/icon";

export function SiteFooter() {
  return <footer className="store-footer"><div className="footer-links"><div className="shop-width"><StoreLink href="https://www.robotis.com/ko/index.php" target="_blank" rel="noreferrer">회사소개</StoreLink><StoreLink href="https://www.robotis.com/ko/contactus.php" target="_blank" rel="noreferrer">오시는 길</StoreLink><StoreLink href="https://www.robotis.com/model/page.php?co_id=policy" target="_blank" rel="noreferrer">사이트 이용약관</StoreLink><StoreLink href="https://www.robotis.com/sub/privacy_s.php" target="_blank" rel="noreferrer"><strong>개인정보처리방침</strong></StoreLink></div></div><div className="shop-width footer-content"><div><Link href="/" className="footer-wordmark">ROBOTIS<span>shop</span></Link><p>(주)로보티즈 · 대표자 김병수<br />서울 강서구 마곡중앙5로1길 37 · 사업자번호 209-81-22390<br />통신판매신고번호 제2018-서울강서-1400호</p><small>ROBOTIS 비공식 포트폴리오 · 상품 및 배너 출처: robotis.com</small></div><div className="footer-contact"><span>CUSTOMER SUPPORT</span><strong>070-8671-2600</strong><a href="mailto:korea@robotis.com"><Icon name="mail" size={15} /> korea@robotis.com</a><small>평일 09:00–18:00 · 주말 및 공휴일 휴무</small></div></div></footer>;
}
