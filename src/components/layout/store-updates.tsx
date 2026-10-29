"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 관리자가 저장하면 이미 열려 있는 같은 브라우저의 스토어 탭도 갱신합니다. */
export function StoreUpdates() {
  const router = useRouter();
  useEffect(() => {
    const channel = new BroadcastChannel("robotis-store-updated");
    channel.onmessage = () => router.refresh();
    return () => channel.close();
  }, [router]);
  return null;
}
