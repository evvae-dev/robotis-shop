"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

type StoreLinkProps = ComponentPropsWithoutRef<"a"> & { href: string };

/** 공식 본사이트로 나가는 링크는 실제 URL을 노출하지 않고 준비 중 알림으로 대체합니다. */
export function StoreLink({ href, target, children, ...props }: StoreLinkProps) {
  const hostname = new URL(href, "https://portfolio.invalid").hostname;
  const blocked = hostname === "robotis.com" || hostname === "www.robotis.com";

  if (blocked) {
    const showNotice = (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      event.stopPropagation();
      window.alert("준비 중인 기능입니다.");
    };
    // 실제 주소와 target을 제거하여 새 탭 열기로도 공식 사이트에 이동하지 않게 합니다.
    return <a {...props} href="#" onClick={showNotice} onAuxClick={showNotice}>{children}</a>;
  }

  if (href.startsWith("/")) return <Link {...props} href={href} target={target}>{children}</Link>;
  return <a {...props} href={href} target={target}>{children}</a>;
}
