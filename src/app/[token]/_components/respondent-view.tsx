"use client";

import Link from "next/link";
import { useState } from "react";

import { SurveyRunner } from "@/components/survey/survey-runner";
import { Button } from "@/components/ui/button";
import { pickQuestions } from "@data/questions";
import { QUADRANTS } from "@data/quadrants";

// 참여자 플로우 (product-spec #5) — 진입 → 설문(8) → 완료 + "나도 만들기"(바이럴 루프).
// 신원·로그인 없음. 본인 설문과 동일 UX(중립 선택지는 없음).
type Step = "intro" | "survey" | "done";

export function RespondentView({ nickname }: { nickname: string }) {
  const [step, setStep] = useState<Step>("intro");

  if (step === "intro") {
    return (
      <main className="flex min-h-full flex-col items-center px-5 pb-8 pt-16 text-center">
        <span className="text-caption-12-medium text-gray-300">서비스 로고</span>
        <div className="mt-8 flex items-center gap-2">
          <span className="rounded-lg bg-blue-100 px-3 py-1 text-body-16-semibold text-gray-900">
            {nickname}
          </span>
          <span className="text-head2-24 font-display2 text-gray-900">
            님의 페이지
          </span>
        </div>
        <p className="mt-4 text-body-14-regular text-gray-300">
          친구들이 보는 나를 모아,
          <br />
          나의 숨은 모습을 발견해요!
        </p>

        {/* 카운트다운 GIF (에셋 placeholder) */}
        <div className="mt-8 flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gray-100 text-center">
          <span className="text-body-14-medium text-gray-400">[GIF]</span>
          <span className="text-caption-12-regular text-gray-300">
            3, 2, 1 카운트하는 캐릭터
          </span>
        </div>

        <p className="mt-auto pt-8 text-body-14-regular text-gray-300">
          {nickname}님에 대한 설문을 해주면
          <br />
          숨은 모습을 함께 그릴 수 있어요!
        </p>
        <Button
          size="lg"
          onClick={() => setStep("survey")}
          className="mt-4 h-13 w-full rounded-2xl text-body-16-semibold"
        >
          설문 시작하기
        </Button>
      </main>
    );
  }

  if (step === "survey") {
    return (
      <SurveyRunner
        questions={pickQuestions(8)}
        subjectLabel={`${nickname}에 대해`}
        onComplete={() => setStep("done")}
        onBack={() => setStep("intro")}
      />
    );
  }

  // done
  return (
    <main className="flex min-h-full flex-col items-center px-5 pb-8 pt-20 text-center">
      <h1 className="text-head2-24 font-display2 text-gray-900">응답 완료!</h1>
      <p className="mt-3 text-body-14-regular text-gray-300">
        소중한 응답으로
        <br />
        {nickname}님의 모습을 그리고 있어요
      </p>

      {/* 4컷 카테고리 프리뷰 (에셋 placeholder) */}
      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        {QUADRANTS.map((q) => (
          <div
            key={q.key}
            className="flex aspect-square items-end justify-center rounded-2xl bg-gray-100 p-3"
          >
            <span className="rounded-md bg-blue-100 px-2 py-1 text-caption-12-medium text-gray-700">
              {q.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto w-full pt-8">
        <p className="mb-3 text-body-14-regular text-gray-300">
          남이 본 내 모습이 궁금하다면?
        </p>
        <Button
          asChild
          size="lg"
          className="h-13 w-full rounded-2xl text-body-16-semibold"
        >
          <Link href="/onboarding/nickname">나도 만들기</Link>
        </Button>
      </div>
    </main>
  );
}
