import Link from "next/link";

import { BgCloud } from "@/components/ui/bg-cloud";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";

// 랜딩 / 온보딩 (product-spec #1 · Figma F01 node 414:13311) — GUI 1차 전경 정합.
// 배경(하늘 그라데이션·Union 블롭)·캐릭터 일러스트는 디자이너 별도 프레임 대기 → 자리만 비움.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
export default function Home() {
  return (
    <main className="relative flex min-h-full flex-col items-center overflow-hidden bg-sky-gradient px-5 pb-8 pt-16 text-center">
      {/* 배경: 하늘 그라데이션(bg-sky-gradient, Figma 그대로) + 구름(BgCloud, 디자이너 번들 이미지) */}
      <BgCloud />

      {/* figma-loose: 로고 top Figma 106px(프레임 기준, status bar 44px 포함) → pt-16(64px) 근사. 디자이너 합의 필요 */}
      <Logo />

      {/* figma-loose: 제목 top Figma 156px(18.48%) → 로고 아래 mt-5(20px) 근사 */}
      {/* figma-loose: 제목 색 Figma pure black → gray-900 근사(palette 최댓값, off-palette 회피) */}
      <h1 className="mt-5 font-display1 text-head1-26 text-gray-900">
        친구들이 보는 나로
        <br />
        {/* figma-loose: "네컷" 색 Figma #2d8cff = blue-500 아님(off-palette) → blue-500 근사. 디자이너 합의 필요 */}
        <span className="font-display2 text-head2-26 text-blue-500">네컷</span>을
        만들어보세요!
      </h1>

      {/* 일러스트·배경 = 디자이너 프레임 대기. 자리만 확보(캐릭터 에셋 public/assets/character-insight.png 보유). */}
      <div className="flex-1" aria-hidden />

      {/* figma-loose: CTA 영역 Figma pb 34px → pb-8(32px, -2px) 근사. 상단 여백은 flex-1로 흡수 */}
      <Cta asChild>
        <Link href="/onboarding/nickname">시작하기</Link>
      </Cta>
    </main>
  );
}
