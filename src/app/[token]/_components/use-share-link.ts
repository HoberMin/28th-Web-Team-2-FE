"use client";

import { useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { shareKakao } from "@/lib/share";

// 공유 관리 화면(F04)의 링크 복사·카카오 공유. 토스트 수명까지 함께 관리한다.
// 결과 화면의 재공유(use-result-share)와는 문구·계측 이벤트가 다르므로 분리해 둔다.

const TOAST_MS = 2200;

/** 안드로이드는 OS 가 자체 복사 안내를 띄워 토스트가 겹친다 → 복사 성공 토스트를 생략 */
const isAndroid = () => /android/i.test(navigator.userAgent);

export function useShareLink(surveyCode: string) {
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

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/${surveyCode}`;

  const copyLink = async () => {
    track("link_copy");
    try {
      await navigator.clipboard.writeText(link);
      if (!isAndroid()) showToast("링크 복사 완료!");
    } catch {
      showToast("복사에 실패했어요. 링크를 길게 눌러 복사해주세요");
    }
  };

  // 카카오 SDK 공유(feed). 인앱브라우저 포함 정식 경로.
  // 키/SDK 실패 시 shareKakao 내부에서 링크 복사로 물러난다.
  // ※ 동작 조건: NEXT_PUBLIC_KAKAO_JS_KEY(운영 앱) + 카카오 콘솔에 웹 도메인 등록.
  const shareToKakao = async () => {
    track("share_kakao_click");
    const result = await shareKakao({
      link,
      title: "친구들이 본 나는 어떤 모습일까?",
      description: "1분이면 돼! 나에 대한 설문을 풀어줘 — looky",
      imageUrl: `${origin}/assets/og-image.png`,
    });
    showToast(
      result === "shared" ? "카카오톡 공유를 열었어요" : "링크를 복사했어요",
    );
  };

  return { toast, copyLink, shareToKakao };
}
