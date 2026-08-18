import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  SurveyResultRawResponse,
  SurveyStatusResponse,
} from "@/apis/survey/types";

const get = vi.fn();
vi.mock("@/apis/http", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import { useGetSurveyResultAPI, useGetSurveyStatusAPI } from "./queries";

// 검증 대상: 엔드포인트 경로 · enabled 게이팅 · 결과 정규화(fallback 우선순위).
// 정규화는 백엔드가 rich quadrants 와 요약 맵(quadrantImageUrls/Interpretations)을
// 함께 주고 어느 쪽이 빌 수 있어서 우선순위가 계약이다.

function wrapper({ children }: { children: ReactNode }) {
  // 테스트에서는 재시도를 끈다 — 실패 케이스가 지연되지 않게
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const RAW: SurveyResultRawResponse = {
  surveyCode: "tok",
  resultStatus: "READY",
  quadrantImageUrls: null,
  quadrantInterpretations: null,
  overall: null,
  overallKeyword: null,
  overallAnalysisTitle: null,
  overallAnalysis: null,
  actionTip: null,
  quadrants: null,
};

describe("useGetSurveyStatusAPI", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("status 엔드포인트를 호출한다", async () => {
    const status = { surveyCode: "tok" } as SurveyStatusResponse;
    get.mockResolvedValue(status);

    const { result } = renderHook(() => useGetSurveyStatusAPI("tok"), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(status));
    expect(get).toHaveBeenCalledWith("/api/v1/surveys/tok/status");
  });

  it("surveyCode 가 없으면 요청하지 않는다", () => {
    renderHook(() => useGetSurveyStatusAPI(undefined), { wrapper });
    expect(get).not.toHaveBeenCalled();
  });

  it("enabled:false 면 요청하지 않는다", () => {
    renderHook(() => useGetSurveyStatusAPI("tok", { enabled: false }), { wrapper });
    expect(get).not.toHaveBeenCalled();
  });
});

describe("useGetSurveyResultAPI — 정규화", () => {
  beforeEach(() => {
    get.mockReset();
  });

  /** 결과 훅을 돌려 정규화된 데이터를 받는다 */
  async function normalize(raw: SurveyResultRawResponse) {
    get.mockResolvedValue(raw);
    const { result } = renderHook(() => useGetSurveyResultAPI("tok"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    return result.current.data!;
  }

  it("result 엔드포인트를 호출한다", async () => {
    await normalize(RAW);
    expect(get).toHaveBeenCalledWith("/api/v1/surveys/tok/result");
  });

  describe("아직 결과 없음 → 빈 결과로 정규화 (폴링 지속 신호)", () => {
    it("resultStatus 가 READY 가 아니면 quadrants=null", async () => {
      const data = await normalize({ ...RAW, resultStatus: "GENERATING" });
      expect(data.quadrants).toBeNull();
      expect(data.resultStatus).toBe("GENERATING");
    });

    it("READY 여도 quadrants 가 없으면 null", async () => {
      const data = await normalize({ ...RAW, resultStatus: "READY", quadrants: null });
      expect(data.quadrants).toBeNull();
    });
  });

  describe("READY — 4칸이 항상 채워진다", () => {
    it("백엔드 대문자 키를 프론트 소문자 키로 매핑한다", async () => {
      const data = await normalize({
        ...RAW,
        quadrants: {
          OPEN: {
            definitionKeyword: "탐험가",
            adjectiveKeywords: ["호기심 많은"],
            interpretation: "새로운 걸 좋아해요",
            imageUrl: "https://cdn/open.png",
          },
        },
      });
      expect(data.quadrants?.open).toEqual({
        definitionKeyword: "탐험가",
        adjectiveKeywords: ["호기심 많은"],
        interpretation: "새로운 걸 좋아해요",
        imageUrl: "https://cdn/open.png",
      });
    });

    // 내용 없는 칸(주로 UNKNOWN)은 백엔드가 키를 생략한다 →
    // 화면이 옵셔널 체이닝을 남발하지 않도록 4칸 키를 항상 만들어 준다.
    it("생략된 칸도 키를 만들고 빈 값으로 채운다", async () => {
      const data = await normalize({
        ...RAW,
        quadrants: {
          OPEN: {
            definitionKeyword: "탐험가",
            adjectiveKeywords: ["호기심 많은"],
            interpretation: "설명",
            imageUrl: "https://cdn/open.png",
          },
        },
      });
      expect(Object.keys(data.quadrants!).sort()).toEqual([
        "blind",
        "hidden",
        "open",
        "unknown",
      ]);
      expect(data.quadrants?.unknown).toEqual({
        definitionKeyword: null,
        adjectiveKeywords: [],
        imageUrl: null,
        interpretation: null,
      });
    });
  });

  describe("fallback 우선순위", () => {
    it("rich quadrants 가 요약 맵보다 우선한다", async () => {
      const data = await normalize({
        ...RAW,
        quadrantImageUrls: { OPEN: "https://cdn/summary.png" },
        quadrantInterpretations: { OPEN: "요약 해설" },
        quadrants: {
          OPEN: {
            definitionKeyword: "탐험가",
            adjectiveKeywords: [],
            interpretation: "상세 해설",
            imageUrl: "https://cdn/rich.png",
          },
        },
      });
      expect(data.quadrants?.open.imageUrl).toBe("https://cdn/rich.png");
      expect(data.quadrants?.open.interpretation).toBe("상세 해설");
    });

    it("rich 에 해당 칸이 없으면 요약 맵으로 채운다", async () => {
      const data = await normalize({
        ...RAW,
        quadrantImageUrls: { BLIND: "https://cdn/summary.png" },
        quadrantInterpretations: { BLIND: "요약 해설" },
        quadrants: {
          OPEN: {
            definitionKeyword: "탐험가",
            adjectiveKeywords: [],
            interpretation: "상세",
            imageUrl: "https://cdn/rich.png",
          },
        },
      });
      expect(data.quadrants?.blind.imageUrl).toBe("https://cdn/summary.png");
      expect(data.quadrants?.blind.interpretation).toBe("요약 해설");
    });

    it("overall 중첩 객체가 평면 필드보다 우선한다", async () => {
      const data = await normalize({
        ...RAW,
        overall: {
          keyword: "중첩 키워드",
          analysisTitle: "중첩 타이틀",
          analysisBody: "본문",
          tip: "팁",
        },
        overallKeyword: "평면 키워드",
        overallAnalysisTitle: "평면 타이틀",
        quadrants: {},
      });
      expect(data.overallKeyword).toBe("중첩 키워드");
      expect(data.overallAnalysisTitle).toBe("중첩 타이틀");
    });

    it("overall 이 없으면 평면 필드를 쓴다", async () => {
      const data = await normalize({
        ...RAW,
        overall: null,
        overallKeyword: "평면 키워드",
        overallAnalysisTitle: "평면 타이틀",
        quadrants: {},
      });
      expect(data.overallKeyword).toBe("평면 키워드");
      expect(data.overallAnalysisTitle).toBe("평면 타이틀");
    });

    it("둘 다 없으면 null", async () => {
      const data = await normalize({ ...RAW, quadrants: {} });
      expect(data.overallKeyword).toBeNull();
      expect(data.overallAnalysisTitle).toBeNull();
    });
  });

  it("surveyCode 가 없으면 요청하지 않는다", () => {
    renderHook(() => useGetSurveyResultAPI(undefined), { wrapper });
    expect(get).not.toHaveBeenCalled();
  });
});
