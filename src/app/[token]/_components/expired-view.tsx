"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// 만료/없는 링크 뷰 (product-spec #8) — Figma 전용 프레임 없어 와이어프레임에서 보강.
// TODO(✍️): 404 규격 vs 만료 안내 분리(개발자 논의).
export function ExpiredView() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-5 pb-8 text-center">
      <div className="flex aspect-square w-40 items-center justify-center rounded-2xl bg-gray-100">
        <span className="text-caption-12-regular text-gray-300">안개·물음표</span>
      </div>
      <h1 className="mt-8 text-head2-20 font-display2 text-gray-900">
        만료됐거나 없는 링크예요
      </h1>
      <p className="mt-3 text-body-14-regular text-gray-300">
        링크가 만료됐거나 잘못된 주소예요.
        <br />
        직접 나만의 네컷을 만들어볼까요?
      </p>

      <div className="mt-auto w-full pt-10">
        <Button
          asChild
          size="lg"
          className="h-13 w-full rounded-2xl text-body-16-semibold"
        >
          <Link href="/">내 것 만들기</Link>
        </Button>
      </div>
    </main>
  );
}
