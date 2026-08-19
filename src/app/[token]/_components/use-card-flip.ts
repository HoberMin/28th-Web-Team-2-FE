"use client";

import { useEffect, useState } from "react";

// F05 카드 확대 모달의 플립 시퀀스 (스펙 §0·§4·§5·§7).
//
//   opening ──layout 애니메이션 완료──▶ open ──0.4s hold──▶ flipping ──0.6s──▶ back
//
// opening 은 시간이 아니라 layout 애니메이션(layoutId 공유) 완료로 끝난다.
// 카드가 원위치에서 중앙까지 이동을 마치기 전에 뒤집히면 안 되기 때문.

export type FlipPhase = "opening" | "open" | "flipping" | "back";

/** 중앙 도착 후 앞면을 보여주는 시간 */
const HOLD_MS = 400;
/** 뒤집히는 데 걸리는 시간 */
const FLIP_MS = 600;

interface UseCardFlipOptions {
  /** ESC·딤 탭 등으로 닫을 때 */
  onClose: () => void;
}

export function useCardFlip({ onClose }: UseCardFlipOptions) {
  const [phase, setPhase] = useState<FlipPhase>("opening");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // open(hold) → flipping
  useEffect(() => {
    if (phase !== "open") return;
    const holdTimer = window.setTimeout(() => setPhase("flipping"), HOLD_MS);
    return () => window.clearTimeout(holdTimer);
  }, [phase]);

  // flipping → back
  useEffect(() => {
    if (phase !== "flipping") return;
    const flipTimer = window.setTimeout(() => setPhase("back"), FLIP_MS);
    return () => window.clearTimeout(flipTimer);
  }, [phase]);

  return {
    phase,
    /** 뒷면이 보이는 상태 (rotateY 180) */
    isFlipped: phase === "flipping" || phase === "back",
    /** 카드가 중앙에 도착했을 때 호출 — layoutId 애니메이션 완료 콜백에 연결 */
    handleLayoutComplete: () => {
      if (phase === "opening") setPhase("open");
    },
    /** 열림은 여유 있게, 닫힘은 위치 복귀(0.4s)와 맞춘다 */
    layoutDuration: phase === "opening" ? 0.6 : 0.4,
  };
}
