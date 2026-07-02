"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMutationState } from "@tanstack/react-query";
import { SELF_SUBMISSION_MUTATION_KEY, useStartSubmissionAPI, useSubmitAnswersAPI } from "@/apis/survey/mutations";
import { isApiError } from "@/apis/error";
import type { AnswerEntry, SubmissionStartedResponse } from "@/apis/survey/types";
import { SurveyRunner } from "@/components/survey/survey-runner";
import { readSession } from "@/lib/local-session";
import { usePreloadImages } from "@/lib/preload-images";
import { clearSelfSurveyCache, isSelfSurveyDone, markSelfSurveyDone, readSelfSurveyCache, saveSelfSurveyCache } from "@/lib/self-survey-cache";
import { Cta } from "@/components/ui/cta";

// 다음 화면(F04 공유) 캐릭터를 설문 푸는 동안 optimized URL로 미리 받아둔다.
// share-view는 next/image(optimized)로 요청하므로, raw png가 아니라 최적화 URL을 데워야 캐시 적중.
const PRELOAD_SHARE_ILLUST = [
  { src: "/assets/img_character_hamster_set.png", width: 1072, height: 615 },
];

// 자기 설문 (product-spec #3) — 필수 선행. 조하리 "나 vs 친구"의 본인 쪽 데이터.
// 세션에서 surveyCode 읽기 → useStartSubmissionAPI로 문항 받기 → SurveyRunner → 제출 → /[surveyCode].
//
// [StrictMode 주의] startSubmission 콜백(mutate 2번째 인자 onSuccess/onError)은
// React StrictMode의 mount→unmount→remount 사이클에서 TanStack Query가 호출을 생략한다.
// 따라서 startMutation의 상태는 콜백 대신 useMutation이 반환하는 data/isError/isPending으로 직접 파악.

export default function SelfSurveyPage() {
  const router = useRouter();

  // ── hooks (early return 앞) ──────────────────────────────────────────────────
  const {
    mutate: startSubmission,
    isPending: isStarting,
    data: submissionData,
    isError: isStartError,
    error: startError,
  } = useStartSubmissionAPI();

  const { mutate: submitAnswers, isPending: isSubmitting } = useSubmitAnswersAPI();

  const [isSubmittingDone, setIsSubmittingDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // SSR-safe: 서버는 null, 클라이언트 마운트 후 localStorage에서 읽음 (hydration mismatch 방지)
  const [cachedData, setCachedData] = useState<SubmissionStartedResponse | null>(null);

  // StrictMode 재마운트로 useMutation 옵저버가 교체돼도 MutationCache에서 결과 복구
  const recoveredData =
    useMutationState({
      filters: { mutationKey: SELF_SUBMISSION_MUTATION_KEY, status: "success" },
      select: (mutation) => mutation.state.data as SubmissionStartedResponse,
    }).at(-1) ?? null;

  // 마운트 시 1회만 호출 (StrictMode double-invoke 방지)
  const startCalledRef = useRef(false);

  // 본인 설문 시작(문항 배정). 마운트·재시도가 공유.
  const runStart = useCallback(() => {
    const session = readSession();
    if (!session?.surveyCode) {
      router.replace("/onboarding/nickname");
      return;
    }
    startSubmission({ surveyCode: session.surveyCode });
  }, [router, startSubmission]);

  useEffect(() => {
    if (startCalledRef.current) return;
    startCalledRef.current = true;

    // 클라이언트 마운트 후 localStorage 캐시 확인 — 있으면 API 호출 생략
    const session = readSession();

    // 이미 제출 완료한 설문이면 결과 페이지로 (결과→back으로 설문 재진입 시 재제출/409 방지)
    if (session?.surveyCode && isSelfSurveyDone(session.surveyCode)) {
      router.replace(`/${session.surveyCode}`);
      return;
    }

    const cached = session?.surveyCode ? readSelfSurveyCache(session.surveyCode) : null;
    if (cached) {
      setCachedData(cached);
      return;
    }

    runStart();
  }, [runStart, router]);

  // API 응답이 오면 캐시에 저장 (재시도·복구 데이터 포함)
  useEffect(() => {
    const apiData = recoveredData ?? submissionData;
    if (!apiData) return;
    const session = readSession();
    if (session?.surveyCode) saveSelfSurveyCache(session.surveyCode, apiData);
  }, [recoveredData, submissionData]);

  // 다음 화면(F04 공유 페이지) 캐릭터 이미지를 설문 푸는 동안 미리 받아 캐시에 적재
  // → 자기설문 완료 후 /[surveyCode](ShareView) 진입 시 즉시 표시(늦은 로드 방지).
  usePreloadImages(PRELOAD_SHARE_ILLUST);

  const effectiveData = cachedData ?? recoveredData ?? submissionData;

  // ── 로딩 — 문항 불러오는 중 ────────────────────────────────────────────────
  // 디자인상 로딩 화면 없음 → 불러오는 동안 아무것도 렌더 안 함
  if (!effectiveData && !isStartError && (isStarting || !submissionData)) {
    return null;
  }

  // ── 에러 — 문항 불러오기 실패 ──────────────────────────────────────────────
  if (isStartError && !effectiveData) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-body-16-medium text-gray-900">
          {isApiError(startError) ? startError.message : "문항을 불러오지 못했어요. 다시 시도해주세요."}
        </p>
        <Cta onClick={runStart}>다시 시도</Cta>
      </div>
    );
  }

  // ── 빈 문항 — 성공했으나 questions가 비어있는 경우 ──────────────────────────
  if (!effectiveData || effectiveData.questions.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-body-16-medium text-gray-900">문항을 불러오지 못했어요. 다시 시도해주세요.</p>
        <Cta onClick={runStart}>다시 시도</Cta>
      </div>
    );
  }

  // ── 제출 로딩 ────────────────────────────────────────────────────────────────
  // 디자인상 로딩 화면 없음 → 제출 중엔 아무것도 렌더 안 함 (성공 시 결과로 이동)
  if (isSubmitting || isSubmittingDone) {
    return null;
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

  const handleComplete = (answers: AnswerEntry[]) => {
    const session = readSession();
    setIsSubmittingDone(true);

    submitAnswers(
      {
        submissionId: effectiveData.submissionId,
        answers,
        surveyCode: session?.surveyCode,
      },
      {
        onSuccess: () => {
          clearSelfSurveyCache();
          const code = session?.surveyCode;
          if (code) {
            markSelfSurveyDone(code); // 결과→back으로 설문 재진입 차단
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
      questions={effectiveData.questions}
      subjectLabel="나에 대해"
      onComplete={handleComplete}
      onBack={() => router.back()}
    />
  );
}
