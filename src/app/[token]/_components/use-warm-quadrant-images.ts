"use client";

import { useEffect } from "react";

import type { SurveyResultResponse } from "@/apis/survey/types";
import { QUADRANTS } from "@data/quadrants";

// 4칸 카드 이미지(백엔드 AI 생성)를 미리 디코딩해 브라우저 캐시에 적재한다.
// 모달 열림/닫힘(플립 복귀) 때 미로드로 흰 배경이 비쳐 깜빡이는 것을 막는다.
//
// imageUrl 은 next/image 의 unoptimized 로 렌더되므로 raw URL 을 그대로 데우면 적중한다
// (optimized 였다면 /_next/image 변형 URL 을 데워야 한다 — lib/preload-images 참조).

export function useWarmQuadrantImages(data: SurveyResultResponse | undefined) {
  useEffect(() => {
    if (!data?.quadrants) return;
    for (const { key } of QUADRANTS) {
      const url = data.quadrants[key]?.imageUrl;
      if (!url) continue;
      const img = new window.Image();
      img.src = url;
    }
  }, [data]);
}
