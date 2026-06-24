import Image from "next/image";
import Link from "next/link";

import { CenteredScreen } from "@/components/layout/centered-screen";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";

// 랜딩 / 온보딩 (product-spec #1 · Figma F01 node 589:3623) — GUI 1차 전경 정합.
// 공통 골격(px-5·상하 스페이서·BgCloud)은 CenteredScreen이 담당. 여기선 콘텐츠+CTA만.
// 콘텐츠 gap(Figma 오토레이아웃): 로고↔제목 32(gap-8), 제목↔캐릭터 84(gap-21).
export default function Home() {
  return (
    <CenteredScreen
      footer={
        <Cta asChild>
          <Link href="/onboarding/nickname">시작하기</Link>
        </Cta>
      }
    >
      <div className="flex flex-col items-center gap-21">
        <div className="flex flex-col items-center gap-8">
          <Logo />
          {/* Figma 변수 확정: 제목 = gray/900(#0F172A), "네컷" = blue/500(#4E8CFF) → 코드 토큰과 일치 */}
          <h1 className="font-display1 text-head1-26 text-gray-900">
            친구들이 보는 나로
            <br />
            <span className="font-display2 text-head2-26 text-blue-500">네컷</span>을
            만들어보세요!
          </h1>
        </div>

        {/* 캐릭터 일러스트 (Figma F01 node 362:2151 img_character_hamster_insight — 말풍선·돋보기·네컷 합성 PNG).
            에셋 public/assets/img_character_hamster_insight.png(4x 1121×1536, w280 h384 동일 비율). */}
        <Image
          src="/assets/img_character_hamster_insight.png"
          alt=""
          aria-hidden
          width={280}
          height={384}
          priority
          className="h-auto w-70 max-w-full select-none"
        />
      </div>
    </CenteredScreen>
  );
}
