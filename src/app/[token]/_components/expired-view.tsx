"use client";

import Link from "next/link";

import { BgCloud } from "@/components/ui/bg-cloud";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";

// 만료 / 없는 링크 안내 뷰 (product-spec §8 스텁).
// 404 또는 EXPIRED 상태. 안내 + [내 것 만들기] (landing 이동).
// TODO(✍️): 404 규격 vs 만료 안내 분리(개발자 논의 — domain.md §4).
export function ExpiredView() {
  return (
    // 배경: bg-gray-gradient(white→gray-200) + BgCloud (RetryView와 동일 톤)
    <main className="relative isolate flex min-h-full flex-col items-center overflow-hidden bg-gray-gradient px-5 pb-6 pt-16 text-center">
      <BgCloud />
      <Logo />

      {/* 타이틀 블록 */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <h1 className="text-head1-24 font-display1 text-gray-900">
          링크를 찾을 수 없어요
        </h1>
        <p className="text-body-18-medium text-gray-300">
          만료됐거나 존재하지 않는 링크예요
        </p>
      </div>

      {/* 하단 블록 */}
      <div className="mt-auto flex w-full flex-col items-center gap-9 pt-8">
        <p className="text-body-16-medium text-gray-300">
          나만의 인생네컷을 만들어볼까요?
        </p>
        <Cta asChild>
          <Link href="/">내 것 만들기</Link>
        </Cta>
      </div>
    </main>
  );
}
