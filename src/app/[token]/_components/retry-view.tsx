"use client";

import Image from "next/image";

import { CenteredScreen } from "@/components/layout/centered-screen";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";

// 결과물 생성 실패 뷰 (product-spec #7 · Figma F05_결과물 생성 실패 노드 1387:3901) — GUI 전경 정합.
// 노출 조건: resultStatus === "FAILED" (AI 결과 생성 실패) **만**.
// 응답 3건 미달로는 이 화면이 뜨지 않는다 — 3건이 찰 때까지 수집(공유) 화면에 머문다
// (시간 만료 개념 폐기, 2026-07-05 확정 · domain.md "결과 미달 처리"). 결과 네컷 생성 안 함.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
export function RetryView({ onRetry }: { onRetry: () => void }) {
  return (
    <CenteredScreen
      background="gray"
      footer={
        // 하단 블록 — 안내문 ↔ CTA: Figma gap 32 + CTA컨테이너 pt 8 = 40(gap-10)
        <div className="flex w-full flex-col items-center gap-10">
          <p className="text-body-16-medium text-gray-300">
            <a
              href="https://www.instagram.com/homin_looky/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              @homin_looky
            </a>
            <br />
            인스타그램으로 제보해 주세요
          </p>
          {/* Figma 주석 "클릭 시 F01 온보딩 이동"이나 onRetry 콜백 시그니처 유지(호출부 결정) */}
          <Cta onClick={onRetry}>다시하기</Cta>
        </div>
      }
    >
      {/* 콘텐츠 오토레이아웃 (Figma node 1387:3908) — 로고그룹 ↔ 캐릭터 gap 80(gap-20) */}
      <div className="flex flex-col items-center gap-20">
        {/* 로고+타이틀 그룹 (1387:3909) — 로고 ↔ 타이틀블록 gap 56(gap-14) */}
        <div className="flex flex-col items-center gap-14">
          <Logo />
          {/* 타이틀 블록 (1387:3911) — 제목 ↔ 서브 gap 12(gap-3) */}
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-head1-24 font-display1 text-gray-900">
              이미지 생성에 실패했어요..
            </h1>
            <p className="text-body-18-medium text-gray-300">
              저희가 돈이 없어요..ㅠㅠ
            </p>
          </div>
        </div>

        {/* 캐릭터 일러스트 — Figma w204 h260. 장식 이미지라 alt="". 에셋 img_character_hamster_sad(4x 870×1070). */}
        <Image
          src="/assets/img_character_hamster_sad.png"
          alt=""
          width={204}
          height={260}
          priority
        />
      </div>
    </CenteredScreen>
  );
}
