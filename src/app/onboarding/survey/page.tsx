"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useStartSubmissionAPI, useSubmitAnswersAPI } from "@/apis/survey/mutations";
import { isApiError } from "@/apis/error";
import type { SurveyQuestion, SubmissionStartedResponse } from "@/apis/survey/types";
import { SurveyRunner } from "@/components/survey/survey-runner";
import { readSession } from "@/lib/local-session";
import { Cta } from "@/components/ui/cta";

// 자기 설문 (product-spec #3) — 필수 선행. 조하리 "나 vs 친구"의 본인 쪽 데이터.
// 세션에서 surveyCode 읽기 → useStartSubmissionAPI로 문항 받기 → SurveyRunner → 제출 → /[surveyCode].

export default function SelfSurveyPage() {
  const router = useRouter();

  // ── hooks (early return 앞) ──────────────────────────────────────────────────
  const { mutate: startSubmission, isPending: isStarting } = useStartSubmissionAPI();
  const { mutate: submitAnswers, isPending: isSubmitting } = useSubmitAnswersAPI();

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [startSettled, setStartSettled] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingDone, setIsSubmittingDone] = useState(false);

  // 마운트 시 1회만 호출 (StrictMode double-invoke 방지)
  const startCalledRef = useRef(false);

  // 본인 설문 시작(문항 배정). 마운트·재시도가 공유.
  const runStart = useCallback(() => {
    const session = readSession();
    if (!session?.surveyCode) {
      router.replace("/onboarding/nickname");
      return;
    }
    setStartError(null);
    startSubmission(
      { surveyCode: session.surveyCode },
      {
        onSuccess: (data: SubmissionStartedResponse) => {
          setStartSettled(true);
          // 성공했는데 문항이 비면 진행 불가 — 무한 로딩 대신 에러로 (재시도 가능)
          if (data.questions.length === 0) {
            setStartError("문항을 불러오지 못했어요. 다시 시도해주세요.");
            return;
          }
          setSubmissionId(data.submissionId);
          setQuestions(data.questions);
        },
        onError: (error) => {
          setStartSettled(true);
          setStartError(
            isApiError(error)
              ? error.message
              : "문항을 불러오지 못했어요. 다시 시도해주세요.",
          );
        },
      },
    );
  }, [router, startSubmission]);

  useEffect(() => {
    if (startCalledRef.current) return;
    startCalledRef.current = true;
    runStart();
  }, [runStart]);

  // ── 로딩 — 문항 불러오는 중 ────────────────────────────────────────────────
  if (isStarting || (!startSettled && !startError)) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
        <p className="text-body-16-medium text-gray-900">문항을 불러오고 있어요</p>
      </div>
    );
  }

  // ── 에러 — 문항 불러오기 실패 ──────────────────────────────────────────────
  if (startError) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-body-16-medium text-gray-900">{startError}</p>
        <Cta onClick={runStart}>다시 시도</Cta>
      </div>
    );
  }

  // ── 제출 로딩 ────────────────────────────────────────────────────────────────
  if (isSubmitting || isSubmittingDone) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
        <p className="text-body-16-medium text-gray-900">
          공유 링크를 만들고 있어요
        </p>
        <p className="text-body-14-regular text-gray-300">잠시만 기다려주세요</p>
      </div>
    );
  }

  // ── 에러 — 제출 실패 ────────────────────────────────────────────────────────
  if (submitError) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-body-16-medium text-gray-900">{submitError}</p>
        <p className="text-body-14-regular text-gray-300">
          답변을 제출하지 못했어요.
        </p>
        <Cta onClick={() => setSubmitError(null)}>다시 시도</Cta>
      </div>
    );
  }

  const handleComplete = (answers: { questionId: number; answerOptionId: number }[]) => {
    if (submissionId === null) return;
    const session = readSession();
    setIsSubmittingDone(true);

    submitAnswers(
      {
        submissionId,
        answers,
        surveyCode: session?.surveyCode,
      },
      {
        onSuccess: () => {
          const code = session?.surveyCode;
          if (code) {
            router.replace(`/${code}`);
          } else {
            router.replace("/");
          }
        },
        onError: (error) => {
          setIsSubmittingDone(false);
          if (isApiError(error)) {
            setSubmitError(error.message);
          } else {
            setSubmitError("제출에 실패했어요. 다시 시도해주세요.");
          }
        },
      },
    );
  };

  return (
    <SurveyRunner
      questions={questions}
      subjectLabel="나에 대해"
      onComplete={handleComplete}
      onBack={() => router.back()}
    />
  );
}
