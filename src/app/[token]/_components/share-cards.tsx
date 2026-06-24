"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { usePreloadImages } from "@/lib/preload-images";

// 공유 안내 카드 캐러셀 (Figma F04 · node 602:6556 / 602:6570 / 602:6584)
// 동작 스펙(Figma dev 주석 그대로):
//   1. 카드1 → 카드2 → 카드3 순서로 2초 동안 노출
//   2. 다음 카드로 이동 시 좌측으로 슬라이드
//   3. 자동/수동(스와이프) 전환 시 인디케이터 상태도 함께 변경
// 무한 루프: 앞뒤로 클론 슬라이드를 1장씩 둬서(앞=카드3, 뒤=카드1) 어느 방향이든 끊김 없이 순환.
// 접근성: prefers-reduced-motion 이면 자동재생·슬라이드 트랜지션을 끈다(수동 스와이프는 유지).

const AUTOPLAY_MS = 2000; // 카드당 노출 2초
const SLIDE_MS = 300; // 슬라이드 전환 시간
const SWIPE_THRESHOLD = 50; // 스와이프 인정 거리(px)
const GAP_PX = 12; // 카드 사이 간격 — 슬라이드 한 칸 이동량에 함께 반영

type ShareCard = {
  src: string;
  /** 일러스트 원본 크기(next/image 비율 계산용) — 표시 높이는 h-37(148px)로 정규화 */
  width: number;
  height: number;
  text: ReactNode;
};

// 일러스트 표시 높이는 h-37(148px)로 통일(디자이너 에셋 높이 통일 작업 진행 중 — 확정 시 재확인).
const CARDS: ShareCard[] = [
  {
    src: "/assets/img_character_hamster_under.png",
    width: 952,
    height: 615,
    text: (
      <>
        1. 아래 버튼으로 <strong className="font-bold">내 링크</strong>를{" "}
        <strong className="font-bold text-blue-500">꼭</strong> 복사해줘!
      </>
    ),
  },
  {
    src: "/assets/img_character_hamster_three.png",
    width: 952,
    height: 615,
    text: <>2. 친구들이 참여할 수 있게 링크를 보내줘!</>,
  },
  {
    src: "/assets/img_character_hamster_clock.png",
    width: 952,
    height: 638,
    text: (
      <>
        3. <strong className="font-bold text-blue-500">3명 이상</strong> 모이면,{" "}
        <strong className="font-bold text-blue-500">24시간 뒤</strong>{" "}
        <strong className="font-bold">내 링크</strong>로 와줘!
      </>
    ),
  },
];

// 2·3번 카드는 슬라이드되어 들어올 때 마운트되므로, 진입 즉시 세 장 모두 미리 받아둔다.
const PRELOAD_CARDS = CARDS.map(({ src, width, height }) => ({ src, width, height }));

// 양끝 클론을 더한 슬라이드 배열: [카드3, 카드1, 카드2, 카드3, 카드1]
const SLIDES: ShareCard[] = [CARDS[CARDS.length - 1], ...CARDS, CARDS[0]];
const FIRST_REAL = 1; // 카드1의 슬라이드 인덱스
const LAST_REAL = CARDS.length; // 카드3의 슬라이드 인덱스

export function ShareCards() {
  // index: SLIDES 기준 위치. 카드1(=FIRST_REAL)에서 시작.
  const [index, setIndex] = useState(FIRST_REAL);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [drag, setDrag] = useState(0); // 스와이프 중 손가락 따라가는 px 오프셋

  const dragging = useRef(false);
  const startX = useRef(0);

  // 캐러셀 카드 3장 선로딩 — 자동 슬라이드로 들어올 때 늦게 뜨지 않게
  usePreloadImages(PRELOAD_CARDS);

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

  // 자동재생 — index가 바뀔 때마다 타이머를 재무장해 카드당 노출 1초를 보장.
  // 드래그 중(paused)이거나 reduced-motion이면 멈춤.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setTimeout(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [paused, reducedMotion, index]);

  // 클론에 도달하면(트랜지션 종료 후) 트랜지션 없이 반대쪽 실 카드로 점프 → 무한 루프.
  // 트랙 자신의 transform 트랜지션만 처리(자식 transition 버블링 오발화 방지).
  const handleTransitionEnd = (e: React.TransitionEvent) => {
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

  // 점프 직후(animate=false) 다음 페인트에서 트랜지션 복구
  useEffect(() => {
    if (animate) return;
    const id = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(id);
  }, [animate]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    setPaused(true);
    setAnimate(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
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

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* 뷰포트 — 한 장씩만 보이도록 가로 클리핑. 세로 스크롤은 허용(touch-action) */}
      <div
        className="w-full overflow-hidden"
        style={{ touchAction: "pan-y" }}
        role="group"
        aria-roledescription="안내 카드"
        aria-label={`공유 안내 ${activeReal + 1}/${CARDS.length}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={cn(
            "flex gap-3 motion-reduce:transition-none",
            animate && "transition-transform ease-out",
          )}
          style={{
            // 한 칸 = 100% + GAP_PX 이므로 인덱스마다 gap만큼 추가 이동시켜 카드를 정확히 맞춤
            transform: `translateX(calc(${-index * 100}% + ${-index * GAP_PX + drag}px))`,
            transitionDuration: animate ? `${SLIDE_MS}ms` : "0ms",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {SLIDES.map((card, i) => (
            <CardFrame key={i} card={card} />
          ))}
        </div>
      </div>

      {/* 인디케이터 — 자동/수동 전환 모두 activeReal에 동기화. 탭하면 해당 카드로 이동.
          버튼 hit area는 p-2 -m-2로 확장(점 시각 간격은 유지) */}
      <div className="flex items-center gap-1.5">
        {CARDS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번째 안내 카드 보기`}
            aria-current={i === activeReal}
            className="-m-2 flex p-2"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeReal ? "w-4 bg-gray-900" : "w-1.5 bg-gray-50",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function CardFrame({ card }: { card: ShareCard }) {
  return (
    <div className="w-full shrink-0 select-none">
      {/* 카드 radius 20px·backdrop-blur 10px 는 raw px 유지(디자이너 합의 — 별도 토큰 미등록). */}
      <div className="flex h-76 w-full flex-col items-center justify-center gap-4 rounded-[20px] border border-white bg-white/40 backdrop-blur-[10px]">
        <div className="flex flex-col items-center gap-4">
          {/* 배지 = YPairingFont Bold 14px → head2-14 토큰(Figma head-point2/14 등록 확인). */}
          <span className="rounded-md bg-blue-100 px-3 py-1 font-display2 text-head2-14 text-blue-500">
            결과를 확인하려면?
          </span>
          <Image
            src={card.src}
            alt=""
            aria-hidden
            width={card.width}
            height={card.height}
            draggable={false}
            className="h-37 w-auto"
          />
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-body-14-medium text-gray-700">
          {card.text}
        </p>
      </div>
    </div>
  );
}
