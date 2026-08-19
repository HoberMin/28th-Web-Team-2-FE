"use client";

import Image from "next/image";

import { CenteredScreen } from "@/components/layout/centered-screen";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";

// 결과 게이트 화면 (product-spec #6 · Figma 414:13565 / 589:4060).
// "네컷이 완성됐어요" 인터스티셜 — 본문 진입 전 한 박자. 순수 프레젠테이션(상태 없음).

interface ResultGateProps {
  nickname: string;
  respondentCount: number;
  onStart: () => void;
}

export function ResultGate({
  nickname,
  respondentCount,
  onStart,
}: ResultGateProps) {
  return (
    <CenteredScreen footer={<Cta onClick={onStart}>내 네컷 결과 보기</Cta>}>
      {/* 콘텐츠 오토레이아웃 (Figma node 589:4060) — 로고+타이틀 그룹 ↔ 일러스트 gap 56(gap-14) */}
      <div className="flex w-full flex-col items-center gap-14">
        {/* 로고 ↔ 타이틀블록 gap 56(gap-14, 타이틀 top 176→188 이동 디자이너 교정) */}
        <div className="flex flex-col items-center gap-14">
          <Logo />
          {/* 타이틀 블록 — 제목 ↔ 서브 gap 12(gap-3) */}
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-head1-24 font-display1 text-gray-900">
              <span className="text-blue-500">{nickname}</span>님의 네컷이
              <br />
              완성됐어요
            </h1>
            <p className="text-body-16-medium text-gray-300">
              친구 {respondentCount}명의 응답을 보러 갈까요?
            </p>
          </div>
        </div>

        {/* 일러스트 — Figma img_character_hamster_insight_noword(270×334, 중앙). 에셋 4x 1085×1336. 장식이라 alt="". */}
        <Image
          src="/assets/img_character_hamster_insight_noword.png"
          alt=""
          aria-hidden
          width={270}
          height={334}
          priority
          className="w-67.5 max-w-full select-none"
        />
      </div>
    </CenteredScreen>
  );
}
