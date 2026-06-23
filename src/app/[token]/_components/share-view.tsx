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

// 공유 관리 뷰 (product-spec #4 · Figma F04 node 414:13419) — GUI 1차 전경 정합.
// 핵심 루프: 링크를 퍼뜨려 참여자 모으기. 인스타 스토리는 세로형(story-share) 공유 + 링크 클립보드 복사,
// 카카오 피드는 가로형 OG(og-image) 사용 (domain.md §1).
// 배경(하늘 그라데이션·Union)·중앙 일러스트는 디자이너 별도 프레임 대기 → placeholder만.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
// TODO(✍️): 24h 만료·전환 책임 위치(클라/서버).
interface ShareViewProps {
  nickname: string;
  token: string;
  // ⚠ figma-loose(충돌): respondentCount·hoursLeft 는 product-spec #4의 '수집 게이지·카운트다운'용이나
  //   Figma GUI 1차 F04엔 해당 UI가 없음 → 현재 미렌더. props는 게이지 복원 합의 대비 유지. (task #8 리포트)
  respondentCount: number;
  hoursLeft: number;
}

export function ShareView({ nickname, token }: ShareViewProps) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/${token}`;
  // 인스타 스토리: 세로형(1080×1920) / 카카오 피드: 가로형 OG(1200×630)
  const storyImageUrl = `${origin}/assets/story-share.png`;
  const ogImageUrl = `${origin}/assets/og-image.png`;

  const showToast = (msg: string) => {
    setToast(msg);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("링크가 복사됐어요!");
    } catch {
      showToast("복사에 실패했어요. 링크를 길게 눌러 복사해주세요");
    }
  };

  const instaMessage: Record<ShareResult, string> = {
    shared: "이미지 저장 + 링크 복사 완료! 인스타 스토리에서 이미지 선택 후 링크를 붙여넣어 주세요",
    copied: "링크가 복사됐어요! 인스타 스토리에 붙여넣어 주세요",
    unsupported: "공유에 실패했어요. 링크 복사를 이용해주세요",
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
    <main className="relative isolate flex min-h-full flex-col overflow-hidden bg-sky-gradient px-5 pb-10 pt-9">
      {/* 배경: 하늘 그라데이션(Figma 그대로) + 구름(BgCloud) */}
      <BgCloud />

      <Logo size="sm" />

      {/* figma-loose: 제목 블록 top Figma 137px → 로고 아래 mt-8(32px) 근사, 제목↔본문 gap-3(12px) Figma 일치 */}
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

      {/* 중앙 일러스트 = 디자이너 프레임 대기. Figma도 placeholder(350×305 흰 박스)로 자리만 잡아둠. */}
      <div className="mt-7 flex aspect-[350/305] w-full flex-col items-center justify-center gap-1 rounded-2xl bg-white text-center">
        <span className="text-body-18-semibold text-gray-200">
          일러스트 이미지 삽입 예정
        </span>
        <span className="text-body-18-semibold text-gray-200">
          *대략적인 위치만 참고해 주세요
        </span>
      </div>

      {/* 공유 CTA — figma-loose: Figma CTA 영역 pb 40px·gap 8px → main pb-10(40px) Figma 일치, gap-2(8px) Figma 일치 */}
      <div className="mt-auto flex flex-col gap-2 pt-7">
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

      {/* 토스트 */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-6 mx-auto w-fit max-w-[90%] rounded-full bg-gray-900 px-4 py-2 text-center text-caption-12-medium text-white shadow-lg md:absolute"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
