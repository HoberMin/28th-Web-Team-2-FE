"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { CtaSmall } from "@/components/ui/cta-small";
import { Logo } from "@/components/ui/logo";
import { formatResultDate } from "@/lib/format-date";
import type { SurveyResultResponse } from "@/apis/survey/types";
import {
  QUADRANTS,
  QUADRANT_FRONT_LABEL,
  QUADRANT_LABEL,
} from "@data/quadrants";
import type { QuadrantKey } from "@data/quadrants";

import { ResultCardModal } from "./result-card-modal";
import { ResultFourCuts } from "./result-four-cuts";
import { ResultTapHint } from "./result-tap-hint";
import { useTapHint } from "./use-tap-hint";

// 결과 본문 (product-spec #6 · Figma F05 컴팩트).
// 헤더 + 4cuts 다크카드 + 디스클레이머 + 하단 공유바 + 힌트/모달/토스트 오버레이.
// 데이터 조회·phase 전환은 result-view 가 맡고 여기선 화면만 그린다.

interface ResultBodyProps {
  nickname: string;
  resultAvailableAt: string;
  data: SurveyResultResponse | undefined;
  /** 진입 1초 후 뜨는 1회성 "눌러봐" 힌트 */
  hint: ReturnType<typeof useTapHint>;
  toast: string | null;
  onShareCopy: () => void;
  onShareKakao: () => void;
}

export function ResultBody({
  nickname,
  resultAvailableAt,
  data,
  hint,
  toast,
  onShareCopy,
  onShareKakao,
}: ResultBodyProps) {
  const [selectedKey, setSelectedKey] = useState<QuadrantKey | null>(null);
  // 힌트 정렬 기준 — 실제 첫 그리드 카드(모두가 아는 나)
  const firstCardRef = useRef<HTMLButtonElement | null>(null);

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
        <CtaSmall variant="stroke_icn" onClick={onShareCopy} className="flex-1 border-gray-100">
          링크 복사하기
        </CtaSmall>
        <CtaSmall variant="fill" onClick={onShareKakao} className="flex-1">
          카카오톡 공유하기
        </CtaSmall>
      </div>

      {/* ── "눌러봐" 힌트 오버레이 (진입 1초 후, 1회성) — Figma 1268-7019 ────── */}
      {hint.visible && (
        <ResultTapHint
          anchorRef={firstCardRef}
          firstCardImageUrl={firstImageUrl}
          firstCardLabel={QUADRANT_LABEL[firstQuadrant.key]}
          onDismiss={hint.dismiss}
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
            onShareCopy={() => void onShareCopy()}
            onShareKakao={() => void onShareKakao()}
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
