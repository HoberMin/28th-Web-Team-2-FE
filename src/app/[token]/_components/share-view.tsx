"use client";

import { useEffect, useRef, useState } from "react";

import { BgCloud } from "@/components/ui/bg-cloud";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { DownloadIcon } from "@/components/ui/icons/download";
import { Logo } from "@/components/ui/logo";
import { Tooltip } from "@/components/ui/tooltip";

import { ShareCards } from "./share-cards";

// 공유 관리 뷰 (product-spec #4 · Figma F04 node 414:13419) — GUI 1차 전경 정합.
// 핵심 루프: 링크를 퍼뜨려 참여자 모으기.
// 하단 버튼: [내 링크 복사하기 flex-1] + [다운로드 아이콘 w-16] 단일 행.
// 다운로드는 인스타 스토리 공유용 이미지 저장(story-share.png). <a download> 방식.
// 배경(하늘 그라데이션·Union)·중앙 일러스트는 디자이너 별도 프레임 대기 → placeholder만.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
// TODO(✍️): 24h 만료·전환 책임 위치(클라/서버).
// TODO(✍️): product-spec #4의 수집 게이지·카운트다운(응답수/남은시간)은 Figma GUI 1차 F04에 UI가 없어 미구현.
// 디자인 합의되면 status의 peerSubmissionCount/requiredPeerSubmissionCount/remainingSecondsToResultOpen로 추가.
interface ShareViewProps {
  surveyCode: string;
}

export function ShareView({ surveyCode }: ShareViewProps) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/${surveyCode}`;
  // 인스타 스토리 공유용 세로형(1080×1920) 이미지 — 다운로드 버튼으로 저장
  const storyImageUrl = `${origin}/assets/story-share.png`;

  const showToast = (msg: string) => {
    setToast(msg);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("링크 복사 완료!");
    } catch {
      showToast("복사에 실패했어요. 링크를 길게 눌러 복사해주세요");
    }
  };

  // 인스타 스토리 공유용 이미지를 <a download>로 저장.
  // 동일 출처(origin/assets/)라 fetch 없이 앵커 download 속성 직접 사용.
  // 주의: <a download>는 자산 누락(404)을 동기적으로 검출하지 못함 — DOM 예외만 방어.
  const handleDownload = () => {
    try {
      const a = document.createElement("a");
      a.href = storyImageUrl;
      a.download = "looky-story.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("이미지를 저장했어요");
    } catch {
      showToast("이미지 저장에 실패했어요. 다시 시도해주세요");
    }
  };

  return (
    // figma-loose: 로고 top Figma 80px(프레임, status bar 44px 포함) → pt-9(36px) 근사
    <main className="relative isolate flex min-h-full flex-col overflow-hidden bg-sky-gradient px-5 pb-6 pt-9">
      {/* 배경: 하늘 그라데이션(Figma 그대로) + 구름(BgCloud) */}
      <BgCloud />

      <Logo size="sm" />

      {/* figma-loose: 제목 블록 top Figma 136px(디자이너 교정) → 로고 아래 mt-8(32px) 근사, 제목↔본문 gap-3(12px) Figma 일치 */}
      <div className="mt-8 flex flex-col gap-3">
        {/* Figma 627:9619: head-point1/24 = display1(Y Spotlight) 24px, 색 순수 black(#000) — DSGN 검증 대상(F01은 gray-900) */}
        <h1 className="text-head1-24 font-display1 text-black">
          친구에게 링크를 공유하고
          <br />
          네컷을 받아보세요!
        </h1>
        {/* Figma 627:9620: body/16-medium 16px Medium gray-300 (1줄) */}
        <p className="text-body-16-medium text-gray-300">
          답이 모이면, 24시간 뒤 네컷 결과가 열려요
        </p>
      </div>

      {/* 공유 안내 카드 캐러셀 (Figma F04 카드1~3 자동 슬라이드). 제목블록↔카드 gap 64px(Figma 602:6556) → mt-16. */}
      <div className="mt-16">
        <ShareCards />
      </div>

      {/* 공유 CTA — 단일 행: [링크 복사 flex-1] gap-2 [다운로드 아이콘 w-16]
          Figma Frame 2085673268: row gap-8px, justify-center. CTA 278px + 다운로드 64px + gap 8px = 350.
          모바일: CTA flex-1, 다운로드 고정 w-16(64px). */}
      <div className="relative mt-auto flex flex-col pt-7">
        {/* 토스트 — Figma F04(627:9624): CTA 위 중앙, 버튼과 8px 간격(mb-2) */}
        {toast && (
          <div
            role="status"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-fit max-w-[90%] -translate-x-1/2 rounded-full bg-gray-900/70 px-7 py-2 text-center text-body-14-medium text-white"
          >
            {toast}
          </div>
        )}

        {/* 다운로드 버튼 위 툴팁 — 상시 안내 요소 (토스트와 별개)
            Figma 832:14436: 꼬리가 다운로드 버튼(오른쪽)을 가리키도록 tailAlign="right".
            figma-loose: 툴팁 전체를 오른쪽 정렬해 다운로드 버튼(w-16) 위에 위치 */}
        <div className="mb-2 flex justify-end">
          <Tooltip tailAlign="right">
            <b>인스타 스토리</b> 공유용 이미지 저장하기!
          </Tooltip>
        </div>

        {/* 버튼 행: 링크 복사 + 다운로드 */}
        <div className="flex flex-row items-center gap-2">
          <Cta onClick={handleCopy} className="flex-1">
            내 링크 복사하기
          </Cta>
          {/* 아이콘 전용 variant: w-16(64px) × h-14(56px), border gray-200, bg white */}
          <CtaSmall
            variant="icon"
            onClick={handleDownload}
            aria-label="인스타 스토리 공유용 이미지 저장"
          >
            {/* figma-loose: Figma 28×28px 아이콘 → size-7(28px) */}
            <DownloadIcon className="size-7" />
          </CtaSmall>
        </div>
      </div>
    </main>
  );
}
