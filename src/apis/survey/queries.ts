import { useQuery, type Query } from "@tanstack/react-query";
import { api } from "@/apis/http";
import { surveyKeys } from "@/apis/survey/keys";
import { ApiError } from "@/apis/error";
import type {
  SurveyStatusResponse,
  SurveyResultRawResponse,
  SurveyResultResponse,
  BackendQuadrant,
  QuadrantData,
} from "@/apis/survey/types";
import { BACKEND_QUADRANT_MAP } from "@/apis/survey/types";
import type { QuadrantKey } from "@data/quadrants";

// ─── 공통 옵션 타입 ──────────────────────────────────────────────────────────

// refetchInterval은 number/false 외에, 현재 데이터를 보고 간격을 정하는 함수 형태도 허용
// (resultStatus가 터미널이면 폴링 중단 등 — TanStack Query 표준 시그니처).
interface PollOptions<T> {
  enabled?: boolean;
  refetchInterval?:
    | number
    | false
    | ((query: Query<T, ApiError>) => number | false | undefined);
}

// ─── 결과 정규화 헬퍼 ───────────────────────────────────────────────────────

function normalizeSurveyResult(raw: SurveyResultRawResponse): SurveyResultResponse {
  // READY가 아니거나 rich quadrants가 없으면 아직 결과 없음 — 빈 결과로 정규화(폴링 지속 신호)
  if (raw.resultStatus !== "READY" || !raw.quadrants) {
    return {
      surveyCode: raw.surveyCode,
      resultStatus: raw.resultStatus,
      overallKeyword: null,
      overallAnalysis: null,
      actionTip: null,
      quadrants: null,
    };
  }

  const backendKeys: BackendQuadrant[] = ["OPEN", "BLIND", "HIDDEN", "UNKNOWN"];
  const quadrants = {} as Record<QuadrantKey, QuadrantData>;

  for (const backendKey of backendKeys) {
    const frontKey = BACKEND_QUADRANT_MAP[backendKey];
    // rich quadrants 우선, 없는 필드는 요약 맵(quadrantImageUrls/Interpretations)으로 fallback
    const detail = raw.quadrants[backendKey];
    quadrants[frontKey] = {
      definitionKeyword: detail?.definitionKeyword ?? null,
      adjectiveKeywords: detail?.adjectiveKeywords ?? [],
      imageUrl: detail?.imageUrl ?? raw.quadrantImageUrls?.[backendKey] ?? null,
      interpretation:
        detail?.interpretation ?? raw.quadrantInterpretations?.[backendKey] ?? null,
    };
  }

  return {
    surveyCode: raw.surveyCode,
    resultStatus: raw.resultStatus,
    overallKeyword: raw.overallKeyword,
    overallAnalysis: raw.overallAnalysis,
    actionTip: raw.actionTip,
    quadrants,
  };
}

// ─── useGetSurveyStatusAPI ───────────────────────────────────────────────────

export function useGetSurveyStatusAPI(
  surveyCode: string | undefined,
  options?: PollOptions<SurveyStatusResponse>,
) {
  return useQuery<SurveyStatusResponse, ApiError>({
    queryKey: surveyKeys.status(surveyCode ?? ""),
    queryFn: () => {
      if (!surveyCode) throw new ApiError(0, "surveyCode가 없습니다.");
      return api.get<SurveyStatusResponse>(`/api/v1/surveys/${surveyCode}/status`);
    },
    enabled: !!surveyCode && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

// ─── useGetSurveyResultAPI ───────────────────────────────────────────────────

export function useGetSurveyResultAPI(
  surveyCode: string | undefined,
  options?: PollOptions<SurveyResultResponse>,
) {
  return useQuery<SurveyResultResponse, ApiError>({
    queryKey: surveyKeys.result(surveyCode ?? ""),
    queryFn: async () => {
      if (!surveyCode) throw new ApiError(0, "surveyCode가 없습니다.");
      const raw = await api.get<SurveyResultRawResponse>(
        `/api/v1/surveys/${surveyCode}/result`,
      );
      return normalizeSurveyResult(raw);
    },
    enabled: !!surveyCode && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}
