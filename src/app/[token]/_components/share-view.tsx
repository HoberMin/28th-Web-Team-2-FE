"use client";

import { useEffect, useRef, useState } from "react";

import { BgCloud } from "@/components/ui/bg-cloud";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { Logo } from "@/components/ui/logo";
import {
  shareInstagramStory,
  shareKakao,
  type ShareResult,
} from "@/lib/share";

import { ShareCards } from "./share-cards";

// 공유 관리 뷰 (product-spec #4 · Figma F04 node 414:13419) — GUI 1차 전경 정합.
// 핵심 루프: 링크를 퍼뜨려 참여자 모으기. 인스타 스토리는 세로형(story-share) 공유 + 링크 클립보드 복사,
// 카카오 피드는 가로형 OG(og-image) 사용 (domain.md §1).
// 배경(하늘 그라데이션·Union)·중앙 일러스트는 디자이너 별도 프레임 대기 → placeholder만.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
// TODO(✍️): 24h 만료·전환 책임 위치(클라/서버).
// TODO(✍️): product-spec #4의 수집 게이지·카운트다운(응답수/남은시간)은 Figma GUI 1차 F04에 UI가 없어 미구현.
// 디자인 합의되면 status의 peerSubmissionCount/requiredPeerSubmissionCount/remainingSecondsToResultOpen로 추가.
interface ShareViewProps {
  nickname: string;
  surveyCode: string;
}

export function ShareView({ nickname, surveyCode }: ShareViewProps) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/${surveyCode}`;
  // 인스타 스토리: 세로형(1080×1920) / 카카오 피드: 가로형 OG(1200×630)
  const storyImageUrl = `${origin}/assets/story-share.png`;
  const ogImageUrl = `${origin}/assets/og-image.png`;

  const showToast = (msg: string) => {
    setToast(msg);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  };

  // Figma F04(627:9624): 내 링크 복사·인스타 스토리 공유 모두 성공 시 동일 토스트.
  // 인스타 스토리는 링크를 클립보드로 넘기므로 "링크 복사 완료!" 문구가 두 버튼에 공통.
  const copyDoneToast = "링크 복사 완료!";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast(copyDoneToast);
    } catch {
      showToast("복사에 실패했어요. 링크를 길게 눌러 복사해주세요");
    }
  };

  // 성공(shared·copied) 시 복사 버튼과 동일 토스트, 실패만 안내 분기.
  const instaMessage: Record<ShareResult, string> = {
    shared: copyDoneToast,
    copied: copyDoneToast,
    unsupported: "이 기기에선 공유가 어려워요. 링크 복사를 이용해주세요",
    error: "공유에 실패했어요. 다시 시도해주세요",
  };

  const kakaoMessage: Record<ShareResult, string> = {
    shared: "카카오톡 공유를 열었어요",
    copied: "카카오 공유가 준비 안 돼 링크를 복사했어요",
    unsupported: "공유가 어려워요. 링크 복사를 이용해주세요",
    error: "공유에 실패했어요. 다시 시도해주세요",
  };

  const handleInstagram = async () => {
    const result = await shareInstagramStory({ link, imageUrl: storyImageUrl });
    showToast(instaMessage[result]);
  };

  const handleKakao = async () => {
    const result = await shareKakao({
      link,
      title: `${nickname}님이 보는 나, 궁금하지 않아?`,
      description: "친구들이 본 나를 인생네컷으로. looky",
      imageUrl: ogImageUrl,
    });
    showToast(kakaoMessage[result]);
  };

  return (
    // figma-loose: 로고 top Figma 80px(프레임, status bar 44px 포함) → pt-9(36px) 근사
    <main className="relative isolate flex min-h-full flex-col overflow-hidden bg-sky-gradient px-5 pb-6 pt-9">
      {/* 배경: 하늘 그라데이션(Figma 그대로) + 구름(BgCloud) */}
      <BgCloud />

      <Logo size="sm" />

      {/* figma-loose: 제목 블록 top Figma 136px(디자이너 교정) → 로고 아래 mt-8(32px) 근사, 제목↔본문 gap-3(12px) Figma 일치 */}
      <div className="mt-8 flex flex-col gap-3">
        {/* Figma: head-point1/24 = display1(Y Spotlight) 24px */}
        <h1 className="text-head1-24 font-display1 text-gray-900">
          친구들에게 링크를 공유하고
          <br />
          네컷을 받아보세요!
        </h1>
        {/* Figma: body/16-medium 16px Medium gray-300 */}
        <p className="text-body-16-medium text-gray-300">
          친구들의 답이 모이면,
          <br />
          24시간 뒤 나를 담은 네컷 결과가 열려요
        </p>
      </div>

      {/* 공유 안내 카드 캐러셀 (Figma F04 카드1~3 자동 슬라이드). 제목블록↔카드 gap 44px → mt-11. */}
      <div className="mt-11">
        <ShareCards />
      </div>

      {/* 공유 CTA — figma-loose: Figma CTA 영역 pb·gap 8px → gap-2(8px) Figma 일치 */}
      <div className="relative mt-auto flex flex-col gap-2 pt-7">
        {/* 토스트 — Figma F04(627:9624): CTA 위 중앙, 버튼과 8px 간격(mb-2) */}
        {toast && (
          <div
            role="status"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-fit max-w-[90%] -translate-x-1/2 rounded-full bg-gray-900/70 px-7 py-2 text-center text-body-14-medium text-white"
          >
            {toast}
          </div>
        )}

        <Cta onClick={handleCopy}>내 링크 복사하기</Cta>
        <div className="flex gap-2">
          <CtaSmall
            variant="stroke"
            onClick={handleInstagram}
            className="flex-1"
          >
            인스타 스토리 공유
          </CtaSmall>
          <CtaSmall variant="fill" onClick={handleKakao} className="flex-1">
            카카오톡 공유
          </CtaSmall>
        </div>
      </div>
    </main>
  );
}
