"use client";

import { useEffect, useRef } from "react";

import type { SurveyResultResponse } from "@/apis/survey/types";
import { track } from "@/lib/analytics";

// 결과 화면의 계측 (product-spec #6). 상태를 만들지 않고 부수효과만 낸다.

interface UseResultAnalyticsArgs {
  /** 본문(body)에 도달했는지 — 게이트·로딩 연출 중에는 집계하지 않는다 */
  reachedBody: boolean;
  data: SurveyResultResponse | undefined;
}

export function useResultAnalytics({ reachedBody, data }: UseResultAnalyticsArgs) {
  // 결과 본문 도달 — KPI "결과 도달 → 재공유"의 분모
  useEffect(() => {
    if (reachedBody) track("result_view");
  }, [reachedBody]);

  // 이미지가 실제로 준비된 시점 — 생성 대기(폴링)를 얼마나 겪는지 보는 지표.
  // quadrants 가 처음 채워질 때 1회만. 폴링으로 같은 데이터가 반복 유입돼도 중복 발화하지 않는다.
  const sentRef = useRef(false);
  useEffect(() => {
    if (sentRef.current || !data?.quadrants) return;
    sentRef.current = true;
    track("result_image_ready");
  }, [data]);
}
