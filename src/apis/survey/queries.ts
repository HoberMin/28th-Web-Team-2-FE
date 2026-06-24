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
  // READY가 아니거나 맵이 null/undefined(미포함)면 아직 결과 없음 — 빈 결과로 정규화
  if (
    raw.resultStatus !== "READY" ||
    !raw.quadrantImageUrls ||
    !raw.quadrantInterpretations
  ) {
    return {
      surveyCode: raw.surveyCode,
      resultStatus: raw.resultStatus,
      quadrants: null,
    };
  }

  const backendKeys: BackendQuadrant[] = ["OPEN", "BLIND", "HIDDEN", "UNKNOWN"];
  const quadrants = {} as Record<QuadrantKey, QuadrantData>;

  for (const backendKey of backendKeys) {
    const frontKey = BACKEND_QUADRANT_MAP[backendKey];
    quadrants[frontKey] = {
      imageUrl: raw.quadrantImageUrls[backendKey] ?? null,
      interpretation: raw.quadrantInterpretations[backendKey] ?? null,
    };
  }

  return {
    surveyCode: raw.surveyCode,
    resultStatus: raw.resultStatus,
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
