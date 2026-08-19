"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useGetSurveyResultAPI } from "@/apis/survey/queries";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { Logo } from "@/components/ui/logo";
import { track } from "@/lib/analytics";
import { formatResultDate } from "@/lib/format-date";
import { usePreloadImages } from "@/lib/preload-images";
import {
  QUADRANTS,
  QUADRANT_FRONT_LABEL,
  QUADRANT_LABEL,
} from "@data/quadrants";
import type { QuadrantKey } from "@data/quadrants";

import { ResultCardModal } from "./result-card-modal";
import { ResultFourCuts } from "./result-four-cuts";
import { ResultGate } from "./result-gate";
import { ResultLoading } from "./result-loading";
import { ResultStatusScreen } from "./result-status-screen";
import { ResultTapHint } from "./result-tap-hint";
import { useResultShare } from "./use-result-share";

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
  const [selectedKey, setSelectedKey] = useState<QuadrantKey | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  // 힌트 정렬 기준 — 실제 첫 그리드 카드(모두가 아는 나)
  const firstCardRef = useRef<HTMLButtonElement | null>(null);

  // ── hooks (early return 앞) ───────────────────────────────────────────────
  const { toast, handleCopy, handleKakao } = useResultShare({ nickname });

  const { data, isLoading, error, refetch } = useGetSurveyResultAPI(surveyCode, {
    // 결과가 아직 READY가 아니면(quadrants=null) 생성 중 — 준비될 때까지 폴링, 준비되면 중단
    refetchInterval: (query) => (query.state.data?.quadrants ? false : 3000),
  });

  // 결과 본문 도달 (KPI: 결과 도달→재공유 분모)
  useEffect(() => {
    if (phase === "body") track("result_view");
  }, [phase]);

  // 이미지가 실제로 준비된 시점 — 생성 대기(폴링)를 얼마나 겪는지 보는 지표.
  // quadrants 가 처음 채워질 때 1회만. 폴링으로 같은 데이터가 반복 유입돼도 중복 발화하지 않는다.
  const imageReadySentRef = useRef(false);
  useEffect(() => {
    if (imageReadySentRef.current || !data?.quadrants) return;
    imageReadySentRef.current = true;
    track("result_image_ready");
  }, [data]);

  // body 진입 1초 후 힌트 노출(1회성)
  useEffect(() => {
    if (phase !== "body" || hintShown) return;
    const hintTimer = window.setTimeout(() => {
      setHintVisible(true);
      setHintShown(true);
    }, 1000);
    return () => window.clearTimeout(hintTimer);
  }, [phase, hintShown]);

  // 다음 화면(ResultLoading) 캐릭터 2컷(팔 내림/올림)을 gate 화면에서 미리 받아 캐시 적재
  // → loading 진입 후 1초마다 교차될 때 첫 스왑에서 미로드로 깜빡이는 것 방지.
  usePreloadImages(PRELOAD_LOADING_CHARS);

  // 4칸 카드 이미지(백엔드 AI 생성, unoptimized)를 미리 디코딩해 캐시 적재 — 모달 열림/닫힘(플립 복귀)
  // 시 미로드로 흰 배경이 비쳐 깜빡이는 것 방지. imageUrl은 unoptimized라 raw URL 그대로 데우면 적중한다.
  useEffect(() => {
    if (!data?.quadrants) return;
    for (const { key } of QUADRANTS) {
      const url = data.quadrants[key]?.imageUrl;
      if (!url) continue;
      const img = new window.Image();
      img.src = url;
    }
  }, [data]);

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

  // ── 결과 본문 (phase === 'body') — Figma F05 컴팩트 ──────────────────────────
  const resultDate = formatResultDate(resultAvailableAt);
  const selectedData = selectedKey ? data?.quadrants?.[selectedKey] : null;
  const firstQuadrant = QUADRANTS[0];
  const firstImageUrl = data?.quadrants?.[firstQuadrant.key]?.imageUrl ?? null;

  return (
    <main className="relative flex min-h-full flex-col bg-white pb-29">

      {/* ── 헤더 (Figma top 44, h60) ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4">
        <Logo size="sm" />
      </div>

      {/* ── 4cuts 합성 카드 + 디스클레이머 (Figma 627:4706, gap 8) ────────── */}
      <section className="flex flex-col gap-2 px-5 pt-4">
        <ResultFourCuts
          imageUrls={{
            open: data?.quadrants?.open?.imageUrl ?? null,
            blind: data?.quadrants?.blind?.imageUrl ?? null,
            hidden: data?.quadrants?.hidden?.imageUrl ?? null,
            unknown: data?.quadrants?.unknown?.imageUrl ?? null,
          }}
          resultDate={resultDate}
          overallKeyword={data?.overallKeyword}
          nickname={nickname}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          firstCardRef={firstCardRef}
        />

        {/* 디스클레이머 (Figma 1257:8038) */}
        <div className="rounded-lg bg-white px-3 py-2 text-center">
          <p className="text-body-14-medium text-gray-300">
            친구들의 답변을 바탕으로 AI가 그린 이미지예요.
            <br />
            실제와 다를 수 있어요.
          </p>
        </div>
      </section>

      {/* ── 하단 고정 공유바 "btm_CTA_area" (Figma bottom0 fixed, 힌트/모달 딤보다 항상 위 z) ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-(--width-app-frame) gap-1 border-t border-gray-50 bg-white px-5 pb-6 pt-3 md:absolute">
        <CtaSmall variant="stroke_icn" onClick={handleCopy} className="flex-1 border-gray-100">
          링크 복사하기
        </CtaSmall>
        <CtaSmall variant="fill" onClick={handleKakao} className="flex-1">
          카카오톡 공유하기
        </CtaSmall>
      </div>

      {/* ── "눌러봐" 힌트 오버레이 (진입 1초 후, 1회성) — Figma 1268-7019 ────── */}
      {hintVisible && (
        <ResultTapHint
          anchorRef={firstCardRef}
          firstCardImageUrl={firstImageUrl}
          firstCardLabel={QUADRANT_LABEL[firstQuadrant.key]}
          onDismiss={() => setHintVisible(false)}
        />
      )}

      {/* ── 카드 확대 모달 (탭 → 중앙 확대 → 뒤집힘 → 뒷면) — Figma 1257-8140 ── */}
      <AnimatePresence>
        {selectedKey && (
          <ResultCardModal
            key={selectedKey}
            quadrantKey={selectedKey}
            frontLabel={QUADRANT_FRONT_LABEL[selectedKey]}
            imageUrl={selectedData?.imageUrl ?? null}
            definitionKeyword={selectedData?.definitionKeyword ?? null}
            adjectiveKeywords={selectedData?.adjectiveKeywords ?? []}
            interpretation={selectedData?.interpretation ?? null}
            onClose={() => setSelectedKey(null)}
            onShareCopy={() => void handleCopy()}
            onShareKakao={() => void handleKakao()}
          />
        )}
      </AnimatePresence>

      {/* 토스트 — F04·Figma 627:9624 규격 통일(bg gray-900/70·px-7·py-2·body-14-medium) */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-gray-900/70 px-7 py-2 text-center text-body-14-medium text-white md:absolute"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
