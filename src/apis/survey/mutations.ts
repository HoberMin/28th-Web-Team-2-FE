import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/apis/http";
import { ApiError } from "@/apis/error";
import { surveyKeys } from "@/apis/survey/keys";
import type {
  CreateSurveyRequest,
  CreateSurveyResponse,
  SubmissionStartedResponse,
  SubmitAnswersRequest,
  SubmissionCompletedResponse,
  AnswerEntry,
} from "@/apis/survey/types";

// ─── useCreateSurveyAPI ──────────────────────────────────────────────────────

export function useCreateSurveyAPI() {
  return useMutation<CreateSurveyResponse, ApiError, CreateSurveyRequest>({
    mutationFn: (request) =>
      api.post<CreateSurveyResponse>("/api/v1/surveys", request),
  });
}

// ─── useStartSubmissionAPI ───────────────────────────────────────────────────

interface StartSubmissionVariables {
  surveyCode: string;
}

export function useStartSubmissionAPI() {
  return useMutation<SubmissionStartedResponse, ApiError, StartSubmissionVariables>({
    mutationFn: ({ surveyCode }) =>
      // 바디 없음 — 서버가 SELF/PEER 자동 판별
      api.post<SubmissionStartedResponse>(`/api/v1/surveys/${surveyCode}/submissions`),
  });
}

// ─── useSubmitAnswersAPI ─────────────────────────────────────────────────────

interface SubmitAnswersVariables {
  submissionId: number;
  answers: AnswerEntry[];
  /** 있으면 onSuccess에서 해당 설문 상태 캐시 무효화 */
  surveyCode?: string;
}

export function useSubmitAnswersAPI() {
  const queryClient = useQueryClient();

  return useMutation<SubmissionCompletedResponse, ApiError, SubmitAnswersVariables>({
    mutationFn: ({ submissionId, answers }) => {
      const body: SubmitAnswersRequest = { answers };
      return api.post<SubmissionCompletedResponse>(
        `/api/v1/submissions/${submissionId}`,
        body,
      );
    },
    onSuccess: (_, variables) => {
      if (variables.surveyCode) {
        void queryClient.invalidateQueries({
          queryKey: surveyKeys.status(variables.surveyCode),
        });
      }
    },
  });
}
