"use client";

import { useState } from "react";

import { useGetSurveyResultAPI } from "@/apis/survey/queries";
import { Cta } from "@/components/ui/cta";
import { usePreloadImages } from "@/lib/preload-images";

import { ResultBody } from "./result-body";
import { ResultGate } from "./result-gate";
import { ResultLoading } from "./result-loading";
import { ResultStatusScreen } from "./result-status-screen";
import { useResultAnalytics } from "./use-result-analytics";
import { useResultShare } from "./use-result-share";
import { useTapHint } from "./use-tap-hint";
import { useWarmQuadrantImages } from "./use-warm-quadrant-images";

// 결과 뷰 (product-spec #6 · Figma F05 컴팩트 개편 — 인터랙션 3종 스펙 2026-07-02).
// phase 상태머신: gate(!entered) → loading(5초 고정 연출, 결과는 항상 READY) → body(컴팩트).
// body: 헤더 + 4cuts 다크카드(각 칸 button) + 디스클레이머 + 하단 공유바.
//   진입 1초 후 "눌러봐" 힌트 오버레이(1회성) → 4cuts 칸 탭 시 ResultCardModal(중앙 확대→뒤집힘→뒷면).
// 종합분석·칸별상세×4·Tip 인라인 섹션은 컴팩트 개편으로 제거 — 내용은 카드 뒷면 모달로 이동(스펙 §2).
// 상태 3종: 로딩(이미지 생성 대기 — 가장 중요) / 에러(재시도) / ready.
// 빈 칸(imageUrl=null): 그리드는 안개 placeholder, 모달 뒷면은 재참여 메시지 + 공유 CTA(domain.md 빈칸 정책).
// 톤: 백엔드 텍스트 그대로 표시(domain.md §1 긍정/중립 원칙은 서버 책임).
interface ResultViewProps {
  surveyCode: string;
  nickname: string;
  respondentCount: number;
  /** 4cuts 합성카드 날짜 표기용(결과 오픈 시각, status.resultAvailableAt) */
  resultAvailableAt: string;
}

type ResultPhase = "gate" | "loading" | "body";

// 로딩 연출(ResultLoading)의 캐릭터 2컷(팔 내림/올림)을 gate 화면에서 optimized URL로 미리 받아둔다.
// ResultLoading은 next/image(optimized)로 요청하므로 raw png가 아니라 최적화 URL을 데워야 캐시 적중.
const PRELOAD_LOADING_CHARS = [
  { src: "/assets/img_character_hamster_down.png", width: 272, height: 334 },
  { src: "/assets/img_character_hamster_up.png", width: 272, height: 334 },
];

export function ResultView({
  surveyCode,
  nickname,
  respondentCount,
  resultAvailableAt,
}: ResultViewProps) {
  const [phase, setPhase] = useState<ResultPhase>("gate");

  // ── hooks (early return 앞) ───────────────────────────────────────────────
  const { toast, handleCopy, handleKakao } = useResultShare({ nickname });

  const { data, isLoading, error, refetch } = useGetSurveyResultAPI(surveyCode, {
    // 결과가 아직 READY가 아니면(quadrants=null) 생성 중 — 준비될 때까지 폴링, 준비되면 중단
    refetchInterval: (query) => (query.state.data?.quadrants ? false : 3000),
  });

  useResultAnalytics({ reachedBody: phase === "body", data });
  const hint = useTapHint(phase === "body");
  useWarmQuadrantImages(data);

  // 다음 화면(ResultLoading) 캐릭터 2컷(팔 내림/올림)을 gate 화면에서 미리 받아 캐시 적재
  // → loading 진입 후 1초마다 교차될 때 첫 스왑에서 미로드로 깜빡이는 것 방지.
  usePreloadImages(PRELOAD_LOADING_CHARS);

  // ── 로딩 — 이미지 생성 대기 (가장 중요 — product-spec #6) ──────────────────
  if (isLoading) {
    return (
      <ResultStatusScreen
        spinner
        title="결과를 불러오고 있어요"
        description="잠시만 기다려주세요"
      />
    );
  }

  // ── 에러 ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <ResultStatusScreen
        title="결과를 불러오지 못했어요"
        description={error.message}
        action={<Cta onClick={() => void refetch()}>다시 시도</Cta>}
      />
    );
  }

  // ── 생성 대기 — 데이터는 받았지만 아직 READY 아님(quadrants=null). 폴링 중 ──
  if (data && !data.quadrants) {
    return (
      <ResultStatusScreen
        spinner
        title="네컷을 만들고 있어요"
        description="잠시만 기다리면 결과가 나와요"
      />
    );
  }

  // ── 게이트 화면 (phase === 'gate') — Figma 노드 414:13565 / 589:4060 ────────
  if (phase === "gate") {
    return (
      <ResultGate
        nickname={nickname}
        respondentCount={respondentCount}
        onStart={() => setPhase("loading")}
      />
    );
  }

  // ── 로딩 연출 (phase === 'loading') — 순수 5초 고정, Figma 1254-7607/1254-7618 ──
  if (phase === "loading") {
    return <ResultLoading onDone={() => setPhase("body")} />;
  }

  // ── 결과 본문 (phase === 'body') ──────────────────────────────────────────
  return (
    <ResultBody
      nickname={nickname}
      resultAvailableAt={resultAvailableAt}
      data={data}
      hint={hint}
      toast={toast}
      onShareCopy={handleCopy}
      onShareKakao={handleKakao}
    />
  );
}
