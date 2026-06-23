"use client";

import Image from "next/image";

import { CenteredScreen } from "@/components/layout/centered-screen";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";

// 응답 미달 재시도 뷰 (product-spec #7 · Figma F05 결과물 생성 실패 노드 414:13591) — GUI 전경 정합.
// 24h 경과 + 응답 3건 미달. 결과 네컷 생성 안 함. 좌절감 줄이는 톤 + 재시도 유도.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
export function RetryView({
  nickname: _nickname,
  respondentCount: _respondentCount,
  onRetry,
}: {
  nickname: string;
  respondentCount: number;
  onRetry: () => void;
}) {
  return (
    <CenteredScreen
      background="gray"
      footer={
        // 하단 블록 — 안내문 ↔ CTA: Figma gap 32 + CTA컨테이너 pt 8 = 40(gap-10)
        <div className="flex w-full flex-col items-center gap-10">
          <p className="text-body-16-medium text-gray-300">
            24시간 안에 친구 3명이 참여해야
            <br />
            네컷 결과를 만들 수 있어요
          </p>
          {/* Figma 주석 "클릭 시 F01 온보딩 이동"이나 onRetry 콜백 시그니처 유지(호출부 결정) */}
          <Cta onClick={onRetry}>다시하기</Cta>
        </div>
      }
    >
      {/* 콘텐츠 오토레이아웃 (Figma node 602:3484) — 로고그룹 ↔ 캐릭터 gap 80(gap-20) */}
      <div className="flex flex-col items-center gap-20">
        {/* 로고+타이틀 그룹 (602:3483) — 로고 ↔ 타이틀블록 gap 56(gap-14) */}
        <div className="flex flex-col items-center gap-14">
          <Logo />
          {/* 타이틀 블록 (2085673264) — 제목 ↔ 서브 gap 12(gap-3). Figma "3명" 하드코딩 → 목표 상수 3 */}
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-head1-24 font-display1 text-gray-900">
              앗! 3명이 모이지 않았어요..
            </h1>
            <p className="text-body-18-medium text-gray-300">다시 시작해 볼까요?</p>
          </div>
        </div>

        {/* 캐릭터 일러스트 — Figma w204 h260. 장식 이미지라 alt="". */}
        <Image
          src="/assets/character-sad.png"
          alt=""
          width={204}
          height={260}
          priority
        />
      </div>
    </CenteredScreen>
  );
}
