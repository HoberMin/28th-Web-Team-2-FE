"use client";

import { useEffect, useRef } from "react";

import { track } from "@/lib/analytics";

// 공유 관리 화면의 계측 (product-spec #4).
// 상태를 만들지 않고 부수효과만 내므로 뷰에서 떼어내면 화면 코드가 조용해진다.

export function useShareAnalytics(respondentCount: number) {
  // 공유 페이지 진입 — ★ 핵심 퍼널 "링크공유 → 참여자 설문 완료"의 분모.
  // 이 이벤트가 없으면 전환율 자체를 계산할 수 없다.
  useEffect(() => {
    track("share_view");
  }, []);

  // 모인 응답 수 — 사람들이 몇 명에서 멈추는지(0/1/2/3) 분포를 본다.
  // 폴링으로 같은 값이 반복 유입되므로 한 번 보낸 수는 기록해 중복 발화를 막는다
  // (중복 발화하면 지표가 부풀려진다).
  const sentCountsRef = useRef(new Set<number>());
  useEffect(() => {
    if (sentCountsRef.current.has(respondentCount)) return;
    sentCountsRef.current.add(respondentCount);
    track(`respondent_count_${respondentCount}`, { count: respondentCount });
  }, [respondentCount]);
}
