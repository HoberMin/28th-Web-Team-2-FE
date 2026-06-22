"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  shareInstagramStory,
  shareKakao,
  type ShareResult,
} from "@/lib/share";

// 공유 관리 뷰 (product-spec #4) — 주인공·수집중. 핵심 루프: 링크를 퍼뜨려 참여자 모으기.
// 인스타 스토리는 이미지(mascot) 공유 + 링크는 클립보드 복사(스토리 링크 제약 회피, domain.md §1).
// TODO(✍️): 24h 만료·전환 책임 위치(클라/서버), 스토리 공유 이미지 규격.
interface ShareViewProps {
  nickname: string;
  token: string;
  respondentCount: number;
  hoursLeft: number;
}

const TARGET = 3;

export function ShareView({
  nickname,
  token,
  respondentCount,
  hoursLeft,
}: ShareViewProps) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/${token}`
      : `/${token}`;
  const imageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/mascot.png`
      : "/mascot.png";

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
    shared: "공유 시트를 열었어요! 링크는 복사됐으니 스토리에 붙여넣어 주세요",
    copied: "링크가 복사됐어요! 인스타에 붙여넣어 주세요",
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
    const result = await shareInstagramStory({ link, imageUrl });
    showToast(instaMessage[result]);
  };

  const handleKakao = async () => {
    const result = await shareKakao({
      link,
      title: `${nickname}님이 보는 나, 궁금하지 않아?`,
      description: "친구들이 본 나를 인생네컷으로. looky",
      imageUrl,
    });
    showToast(kakaoMessage[result]);
  };

  const ratio = Math.min(respondentCount / TARGET, 1);

  return (
    <main className="relative flex min-h-full flex-col px-5 pb-8 pt-16">
      <span className="text-head1-20 font-display1 text-blue-500">LOOKY</span>

      <h1 className="mt-6 text-head2-24 font-display2 text-gray-900">
        잠깐! 지금 당장 링크를 복사해서
        <br />
        친구들에게 공유해요
      </h1>
      <p className="mt-3 text-body-14-regular text-gray-300">
        24시간 뒤에 {nickname}님의 링크로 돌아오면,
        <br />
        친구들의 시선을.. 보여드릴게요
        <br />단, 3명 이상 모아오세요~~
      </p>

      {/* 스토리 공유 안내 GIF (에셋 placeholder) */}
      <div className="mt-6 flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-100 px-6 text-center">
        <span className="text-body-14-medium text-gray-400">
          [GIF] 인스타 스토리에 링크 붙여넣기
        </span>
        <span className="text-caption-12-regular text-gray-300">
          3명 모으고 24시간 뒤에 다시 와!
        </span>
      </div>

      {/* 수집 현황 */}
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-body-14-medium text-gray-400">
            모인 응답 {respondentCount} / {TARGET}
          </span>
          <span className="text-caption-12-medium text-blue-500">
            {hoursLeft}시간 남음
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        {respondentCount === 0 && (
          <p className="text-caption-12-regular text-gray-300">
            첫 친구를 기다리는 중이에요
          </p>
        )}
      </div>

      {/* 공유 CTA */}
      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button
          size="lg"
          onClick={handleCopy}
          className="h-13 w-full rounded-2xl text-body-16-semibold"
        >
          {nickname}의 링크 복사
        </Button>
        <div className="flex gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={handleInstagram}
            className="h-13 flex-1 rounded-2xl border-gray-100 text-body-14-medium text-gray-700"
          >
            인스타 스토리 공유
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleKakao}
            className="h-13 flex-1 rounded-2xl border-gray-100 text-body-14-medium text-gray-700"
          >
            카카오톡 공유
          </Button>
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
