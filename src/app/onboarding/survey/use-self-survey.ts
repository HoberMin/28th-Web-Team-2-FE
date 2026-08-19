"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMutationState } from "@tanstack/react-query";

import { isApiError } from "@/apis/error";
import {
  SELF_SUBMISSION_MUTATION_KEY,
  useStartSubmissionAPI,
  useSubmitAnswersAPI,
} from "@/apis/survey/mutations";
import type { AnswerEntry, SubmissionStartedResponse } from "@/apis/survey/types";
import { track } from "@/lib/analytics";
import { readSession } from "@/lib/local-session";
import {
  clearSelfSurveyCache,
  isSelfSurveyDone,
  markSelfSurveyDone,
  readSelfSurveyCache,
  saveSelfSurveyCache,
} from "@/lib/self-survey-cache";

// 자기 설문(product-spec #3)의 데이터·전환 로직.
// 문항을 확보하는 경로가 셋이라 이 훅이 그 우선순위를 단독으로 책임진다.
//
//   1) localStorage 캐시   — 새로고침 시 POST 재호출(409) 방지
//   2) StrictMode 복구      — 재마운트로 useMutation 옵저버가 교체돼도 MutationCache 에서 회수
//   3) API 응답            — 최초 진입
//
// [StrictMode 주의] mutate 의 onSuccess/onError 콜백은 mount→unmount→remount 사이클에서
// TanStack Query 가 호출을 생략한다 → 시작 상태는 콜백이 아니라 useMutation 의
// data/isError/isPending 으로 직접 판단한다.

export function useSelfSurvey() {
  const router = useRouter();

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

  // SSR-safe: 서버는 null, 클라이언트 마운트 후 localStorage 에서 읽는다
  const [cachedData, setCachedData] = useState<SubmissionStartedResponse | null>(null);

  const recoveredData =
    useMutationState({
      filters: { mutationKey: SELF_SUBMISSION_MUTATION_KEY, status: "success" },
      select: (mutation) => mutation.state.data as SubmissionStartedResponse,
    }).at(-1) ?? null;

  // 마운트 시 1회만 (StrictMode double-invoke 방지)
  const startCalledRef = useRef(false);

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

    const session = readSession();

    // 이미 제출한 설문이면 결과로 — 결과→back 으로 재진입해 재제출(409)하는 것을 막는다
    if (session?.surveyCode && isSelfSurveyDone(session.surveyCode)) {
      router.replace(`/${session.surveyCode}`);
      return;
    }

    const cached = session?.surveyCode
      ? readSelfSurveyCache(session.surveyCode)
      : null;
    if (cached) {
      // localStorage 는 SSR 에서 읽을 수 없어 마운트 후 1회 초기화가 불가피하다.
      // 렌더 중(또는 useState 지연 초기화)에 읽으면 서버는 빈 화면, 클라이언트는 캐시된
      // 문항을 그려 하이드레이션이 어긋난다. startCalledRef 가드로 1회만 실행되므로
      // 규칙이 경고하는 cascading render 도 발생하지 않는다.
      // TODO(✍️): useSyncExternalStore 로 전환 검토
      //   (getSnapshot 이 매번 새 객체를 반환하지 않도록 캐시 필요 — 무한 루프 위험).
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const data = cachedData ?? recoveredData ?? submissionData;

  const complete = (answers: AnswerEntry[]) => {
    if (!data) return;
    const session = readSession();
    setIsSubmittingDone(true);

    submitAnswers(
      {
        submissionId: data.submissionId,
        answers,
        surveyCode: session?.surveyCode,
      },
      {
        onSuccess: () => {
          track("selfsurvey_complete");
          clearSelfSurveyCache();
          const code = session?.surveyCode;
          if (code) {
            markSelfSurveyDone(code); // 결과→back 으로 설문 재진입 차단
            router.replace(`/${code}`);
          } else {
            router.replace("/");
          }
        },
        onError: (error) => {
          setIsSubmittingDone(false);
          setSubmitError(
            isApiError(error)
              ? error.message
              : "제출에 실패했어요. 다시 시도해주세요.",
          );
        },
      },
    );
  };

  /** 문항 로드 실패 문구 — ApiError 면 서버 메시지, 아니면 기본 안내 */
  const startErrorMessage = isApiError(startError)
    ? startError.message
    : "문항을 불러오지 못했어요. 다시 시도해주세요.";

  return {
    data,
    /** 문항을 아직 못 받았고 에러도 아닌 상태 */
    isLoading: !data && !isStartError && (isStarting || !submissionData),
    isStartError,
    startErrorMessage,
    /** 제출 진행 중 — 화면을 비운다 */
    isSubmitting: isSubmitting || isSubmittingDone,
    submitError,
    retryStart: runStart,
    clearSubmitError: () => setSubmitError(null),
    complete,
    goBack: () => router.back(),
    trackQuestionView: (index: number, total: number) =>
      track(`selfsurvey_q${index + 1}`, { questionIndex: index + 1, total }),
  };
}
