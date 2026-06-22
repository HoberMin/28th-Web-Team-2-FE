"use client";

import { Button } from "@/components/ui/button";

// 응답 미달 재시도 뷰 (product-spec #7) — 24h 경과 + 응답 3건 미달.
// 결과 네컷은 생성 안 함. 좌절감 줄이는 톤 + 재공유 유도.
export function RetryView({
  nickname,
  respondentCount,
  onRetry,
}: {
  nickname: string;
  respondentCount: number;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-5 pb-8 text-center">
      <div className="flex aspect-square w-40 items-center justify-center rounded-2xl bg-gray-100">
        <span className="text-caption-12-regular text-gray-300">캐릭터</span>
      </div>
      <h1 className="mt-8 text-head2-20 font-display2 text-gray-900">
        아직 친구가 충분히 모이지 않았어요
      </h1>
      <p className="mt-3 text-body-14-regular text-gray-300">
        {respondentCount}명이 응답했어요. 3명이 모이면
        <br />
        {nickname}님의 네컷을 만들 수 있어요
      </p>

      <div className="mt-auto w-full pt-10">
        <Button
          size="lg"
          onClick={onRetry}
          className="h-13 w-full rounded-2xl text-body-16-semibold"
        >
          다시하기
        </Button>
      </div>
    </main>
  );
}
