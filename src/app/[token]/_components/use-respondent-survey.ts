"use client";

import { useEffect, useRef, useState } from "react";

import { isApiError } from "@/apis/error";
import {
  useStartSubmissionAPI,
  useSubmitAnswersAPI,
} from "@/apis/survey/mutations";
import type { AnswerEntry, SubmissionStartedResponse, SurveyQuestion } from "@/apis/survey/types";
import { track } from "@/lib/analytics";
import { markSurveyDone, markSurveyStarted } from "@/lib/local-session";

// 참여자 설문 상태머신 (product-spec #5).
//   intro(2초 자동전환) → loading → survey → submitting → done
//                                     └ 실패 ──────────────→ error
// 뷰는 step 에 따라 화면만 고르고, 전환·API·계측은 이 훅이 맡는다.

export type RespondentStep =
  | "intro"
  | "loading"
  | "survey"
  | "submitting"
  | "done"
  | "error";

/** intro 스플래시 노출 시간 */
const INTRO_MS = 2000;

export function useRespondentSurvey(surveyCode: string) {
  const { mutate: startSubmission } = useStartSubmissionAPI();
  const { mutate: submitAnswers } = useSubmitAnswersAPI();

  const [step, setStep] = useState<RespondentStep>("intro");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const introTimerRef = useRef<number | null>(null);

  // 이 세션에서 설문 플로우에 진입했음을 표시 — 이후 상위 폴링이 GENERATING/READY로
  // 바뀌어도 설문 도중 결과 화면으로 튕기지 않게 하는 가드(page.tsx respondentInProgress).
  useEffect(() => {
    markSurveyStarted(surveyCode);
    track("respond_view"); // KPI: 참여자 설문 완료율 분모
  }, [surveyCode]);

  // intro 자동 전환 → 문항 요청
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
            setErrorMessage(
              isApiError(error)
                ? error.message
                : "문항을 불러오지 못했어요. 다시 시도해주세요.",
            );
            setStep("error");
          },
        },
      );
    }, INTRO_MS);
    return () => {
      if (introTimerRef.current !== null)
        window.clearTimeout(introTimerRef.current);
    };
  }, [step, surveyCode, startSubmission]);

  const complete = (answers: AnswerEntry[]) => {
    if (submissionId === null) return;
    setStep("submitting");

    submitAnswers(
      { submissionId, answers },
      {
        onSuccess: () => {
          track("respond_complete");
          // 결과에서 back 으로 설문에 재진입해 재제출(409)하는 것을 막는 표시
          markSurveyDone(surveyCode);
          setStep("done");
        },
        onError: (error) => {
          setErrorMessage(
            isApiError(error)
              ? error.message
              : "제출에 실패했어요. 다시 시도해주세요.",
          );
          setStep("error");
        },
      },
    );
  };

  /** 에러 화면의 [다시 시도] — intro 부터 통째로 재시작 */
  const retry = () => {
    setErrorMessage(null);
    setStep("intro");
  };

  const trackQuestionView = (index: number, total: number) =>
    track(`respond_q${index + 1}`, { questionIndex: index + 1, total });

  return {
    step,
    questions,
    errorMessage,
    complete,
    retry,
    trackQuestionView,
  };
}
