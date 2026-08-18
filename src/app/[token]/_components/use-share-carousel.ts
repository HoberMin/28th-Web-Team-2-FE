"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, TransitionEvent } from "react";

import {
  AUTOPLAY_MS,
  SLIDE_MS,
  SWIPE_THRESHOLD,
} from "./share-cards.constants";
import { CARDS, FIRST_REAL, LAST_REAL, SLIDES } from "./share-cards.data";

// 캐러셀 상태머신. 자동재생·무한 루프·스와이프·reduced-motion 이 서로 얽혀 있어
// 뷰에서 떼어냈다. 뷰는 이 훅이 내주는 값으로 렌더만 한다.
//
// 동작 스펙(사용자 확정)
//   1. 카드1 → 카드2 → 카드3 자동재생 2초, 다음 카드로 좌측 슬라이드
//   2. 무한 루프: 앞뒤로 클론을 1장씩 둬(앞=카드3, 뒤=카드1) 어느 방향이든 끊김 없이 순환
//   3. 자동/수동(스와이프) 전환 모두 인디케이터 동기화
// 접근성: prefers-reduced-motion 이면 자동재생·슬라이드 트랜지션을 끈다(수동 스와이프는 유지).

export function useShareCarousel() {
  // index: SLIDES 기준 위치. 카드1(=FIRST_REAL)에서 시작.
  const [index, setIndex] = useState(FIRST_REAL);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [drag, setDrag] = useState(0); // 스와이프 중 손가락 따라가는 px 오프셋

  const dragging = useRef(false);
  const startX = useRef(0);

  // 인디케이터용 실제 카드 번호(0..2). 클론 위치도 올바른 실 카드로 환산.
  const activeReal = (index - FIRST_REAL + CARDS.length) % CARDS.length;

  // prefers-reduced-motion — 세션 중 토글도 반영
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // 자동재생 — index가 바뀔 때마다 타이머를 재무장해 카드당 노출 2초를 보장.
  // 드래그 중(paused)이거나 reduced-motion이면 멈춤.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setTimeout(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [paused, reducedMotion, index]);

  // 클론 점프 직후(animate=false) 다음 페인트에서 트랜지션 복구.
  // 드래그 중에는 복구하지 않는다 — 복구되면 transition이 되살아나 손가락 추종이 SLIDE_MS만큼 지연됨.
  useEffect(() => {
    if (animate || dragging.current) return;
    const id = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(id);
  }, [animate]);

  // 클론에 도달하면(트랜지션 종료 후) 트랜지션 없이 반대쪽 실 카드로 점프 → 무한 루프.
  // 트랙 자신의 transform 트랜지션만 처리(자식 transition 버블링 오발화 방지).
  const handleTransitionEnd = (e: TransitionEvent) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (index > LAST_REAL) {
      setAnimate(false);
      setIndex(FIRST_REAL);
    } else if (index < FIRST_REAL) {
      setAnimate(false);
      setIndex(LAST_REAL);
    }
  };

  // 인디케이터 클릭 → 해당 실 카드로 이동(키보드·스크린리더·reduced-motion 사용자용 대체 내비)
  const goTo = (real: number) => {
    setAnimate(true);
    setIndex(FIRST_REAL + real);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    setPaused(true);
    setAnimate(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return;
    setDrag(e.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const delta = drag;
    setDrag(0);
    setAnimate(true);
    if (delta < -SWIPE_THRESHOLD) setIndex((i) => i + 1);
    else if (delta > SWIPE_THRESHOLD) setIndex((i) => i - 1);
    setPaused(false);
  };

  return {
    /** SLIDES 기준 현재 위치 */
    index,
    /** 인디케이터용 실 카드 번호(0..2) */
    activeReal,
    /** 드래그 중 손가락 오프셋(px) */
    drag,
    animate,
    /** 트랙·카드에 그대로 넘길 트랜지션 시간 */
    transitionDuration: animate ? `${SLIDE_MS}ms` : "0ms",
    slides: SLIDES,
    cardCount: CARDS.length,
    goTo,
    handleTransitionEnd,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
