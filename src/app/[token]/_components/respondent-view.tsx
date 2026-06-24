"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useStartSubmissionAPI, useSubmitAnswersAPI } from "@/apis/survey/mutations";
import { isApiError } from "@/apis/error";
import type { SurveyQuestion, SubmissionStartedResponse } from "@/apis/survey/types";
import { CenteredScreen } from "@/components/layout/centered-screen";
import { SurveyRunner } from "@/components/survey/survey-runner";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";

// 참여자 플로우 (product-spec #5 · Figma F06 intro node 414:13450) — GUI 1차 전경 정합.
// intro(자동 전환 splash) → 설문(8) → 완료 + "나도 만들기"(바이럴 루프). 신원·로그인 없음.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
type Step = "intro" | "loading" | "survey" | "submitting" | "done" | "error";

interface RespondentViewProps {
  surveyCode: string;
  nickname: string;
}

export function RespondentView({ surveyCode, nickname }: RespondentViewProps) {
  // ── hooks (early return 앞) ───────────────────────────────────────────────
  const { mutate: startSubmission } = useStartSubmissionAPI();
  const { mutate: submitAnswers } = useSubmitAnswersAPI();

  const [step, setStep] = useState<Step>("intro");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // intro 2초 자동 전환
  const introTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (step !== "intro") return;
    introTimerRef.current = window.setTimeout(() => {
      setStep("loading");
      startSubmission(
        { surveyCode },
        {
          onSuccess: (data: SubmissionStartedResponse) => {
            setSubmissionId(data.submissionId);
            setQuestions(data.questions);
            setStep("survey");
          },
          onError: (error) => {
            if (isApiError(error)) {
              setErrorMessage(error.message);
            } else {
              setErrorMessage("문항을 불러오지 못했어요. 다시 시도해주세요.");
            }
            setStep("error");
          },
        },
      );
    }, 2000);
    return () => {
      if (introTimerRef.current !== null)
        window.clearTimeout(introTimerRef.current);
    };
  }, [step, surveyCode, startSubmission]);

  // ── intro 화면 ────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <CenteredScreen
        // figma-loose: F06 진입 하단 안내문 = Figma 블록 414:13468 pb-32. 기본 pb-6(24) → pb-8(32) override.
        className="pb-8"
        footer={
          // Figma: body/16-medium gray-700, 하단 고정
          <p className="text-body-16-medium text-gray-700">
            친구들의 답변이 모이면,
            <br />
            {nickname}님의 네컷이 완성돼요
          </p>
        }
      >
        {/* 콘텐츠 오토레이아웃 (Figma 414:13450) — 로고+타이틀 그룹 ↔ 일러스트 gap 92(gap-23) */}
        <div className="flex w-full flex-col items-center gap-23">
          {/* 로고 ↔ 타이틀 gap 48(gap-12) */}
          <div className="flex flex-col items-center gap-12">
            <Logo />
            <h1 className="text-head1-26 font-display1 text-gray-900">
              <span className="text-blue-500">{nickname}</span>님은
              <br />
              어떤 사람인가요?
            </h1>
          </div>

          {/* 인트로 일러스트 = Figma img_character_hamster_star(350×300). 에셋 4x 1400×1200. 장식이라 alt="". */}
          <Image
            src="/assets/img_character_hamster_star.png"
            alt=""
            aria-hidden
            width={350}
            height={300}
            priority
            className="h-auto w-full max-w-full select-none"
          />
        </div>
      </CenteredScreen>
    );
  }

  // ── 로딩 — 문항 불러오는 중 ──────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
        <p className="text-body-16-medium text-gray-900">문항을 불러오고 있어요</p>
      </div>
    );
  }

  // ── 에러 ─────────────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-body-16-medium text-gray-900">
          {errorMessage ?? "오류가 발생했어요."}
        </p>
        <Cta
          onClick={() => {
            setErrorMessage(null);
            setStep("intro");
          }}
        >
          다시 시도
        </Cta>
      </div>
    );
  }

  // ── 제출 로딩 ─────────────────────────────────────────────────────────────
  if (step === "submitting") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
        <p className="text-body-16-medium text-gray-900">답변을 전달하고 있어요</p>
      </div>
    );
  }

  // ── 설문 화면 ─────────────────────────────────────────────────────────────
  if (step === "survey") {
    const handleComplete = (answers: { questionId: number; answerOptionId: number }[]) => {
      if (submissionId === null) return;
      setStep("submitting");

      submitAnswers(
        { submissionId, answers },
        {
          onSuccess: () => setStep("done"),
          onError: (error) => {
            if (isApiError(error)) {
              setErrorMessage(error.message);
            } else {
              setErrorMessage("제출에 실패했어요. 다시 시도해주세요.");
            }
            setStep("error");
          },
        },
      );
    };

    return (
      // 참여자 설문: 첫 문항 뒤로(onBack) 없음 — 자동 전환 splash로 되돌아갈 필요 없음
      <SurveyRunner
        questions={questions}
        onComplete={handleComplete}
      />
    );
  }

  // done — Figma F06 완료 화면 노드 414:13540 정합.
  return (
    <CenteredScreen
      footer={
        // 하단 블록 — 안내문 ↔ CTA gap 12(gap-3)
        <div className="flex w-full flex-col gap-3">
          {/* Figma: body/14-medium gray-800 중앙 */}
          <p className="text-body-14-medium text-gray-800">
            남이 본 내 모습이 궁금하다면?
          </p>
          {/* Figma 주석: "클릭 시 F01_온보딩 이동" → href="/" (랜딩, product-spec #5 바이럴 루프) */}
          <Cta asChild>
            <Link href="/">나도 만들기</Link>
          </Cta>
        </div>
      }
    >
      {/* 콘텐츠 오토레이아웃 (Figma 414:13540) — 로고+타이틀 그룹 ↔ 일러스트 gap 64(gap-16) */}
      <div className="flex w-full flex-col items-center gap-16">
        {/* 로고 ↔ 타이틀블록 gap 40(gap-10) */}
        <div className="flex flex-col items-center gap-10">
          <Logo />
          {/* 타이틀 블록 — 제목 ↔ 서브 gap 12(gap-3) */}
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-head1-24 font-display1 text-gray-900">
              <span className="text-blue-500">{nickname}</span>님에게
              <br />
              답변을 전했어요!
            </h1>
            <p className="text-body-16-medium text-gray-300">
              방금 답변이 {nickname}님의
              <br />
              네컷을 완성하는 데 보탬이 됐어요
            </p>
          </div>
        </div>

        {/* 완료 일러스트 — Figma 627:9735 img_character_hamster_letter(350×280). 에셋 4x 1400×1120. 장식이라 alt="". */}
        <Image
          src="/assets/img_character_hamster_letter.png"
          alt=""
          aria-hidden
          width={350}
          height={280}
          className="h-auto w-full max-w-full select-none"
        />
      </div>
    </CenteredScreen>
  );
}
