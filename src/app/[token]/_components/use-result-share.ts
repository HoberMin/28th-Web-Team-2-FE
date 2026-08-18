"use client";

import { useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { shareKakao } from "@/lib/share";

// 결과 재공유 로직 (product-spec #6 · KPI: 결과 도달 → 재공유).
// 토스트 상태·타이머·클립보드·카카오 fallback이 뷰 안에 엉켜 있던 것을 훅으로 분리했다.
// 공유 진입점이 하단 공유바와 카드 모달 두 곳이라, 로직을 한 군데 두는 편이 드리프트를 막는다.

const TOAST_MS = 2200;

interface UseResultShareOptions {
  nickname: string;
}

export function useResultShare({ nickname }: UseResultShareOptions) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };

  const currentUrl = () =>
    typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    track("result_reshare_click", { method: "copy" });
    try {
      await navigator.clipboard.writeText(currentUrl());
      showToast("링크 복사 완료!");
    } catch {
      showToast("복사에 실패했어요. 링크를 길게 눌러 복사해주세요");
    }
  };

  const handleKakao = async () => {
    track("result_reshare_click", { method: "kakao" });
    const result = await shareKakao({
      link: currentUrl(),
      title: `${nickname}님의 인생네컷이 나왔어요!`,
      description: "친구들이 본 나를 인생네컷으로. looky",
      imageUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}/assets/og-image.png`
          : "/assets/og-image.png",
    });
    // 카카오 공유 시트가 열린 경우(result === "shared")엔 토스트를 띄우지 않음.
    // 복사로 fallback된 경우에만 안내.
    if (result !== "shared") showToast("링크 복사 완료!");
  };

  return { toast, handleCopy, handleKakao };
}
