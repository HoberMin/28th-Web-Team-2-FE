"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 공유 안내 카드 캐러셀 (Figma F04 · node 602:6556 / 602:6570 / 602:6584)
// 동작 스펙(Figma dev 주석 그대로):
//   1. 카드1 → 카드2 → 카드3 순서로 1초 동안 노출
//   2. 다음 카드로 이동 시 좌측으로 슬라이드
//   3. 자동/수동(스와이프) 전환 시 인디케이터 상태도 함께 변경
// 무한 루프: 앞뒤로 클론 슬라이드를 1장씩 둬서(앞=카드3, 뒤=카드1) 어느 방향이든 끊김 없이 순환.
// 접근성: prefers-reduced-motion 이면 자동재생·슬라이드 트랜지션을 끈다(수동 스와이프는 유지).

const AUTOPLAY_MS = 1000; // 카드당 노출 1초
const SLIDE_MS = 300; // 슬라이드 전환 시간
const SWIPE_THRESHOLD = 50; // 스와이프 인정 거리(px)

type ShareCard = {
  src: string;
  /** 일러스트 원본 크기(next/image 비율 계산용) — 표시 높이는 h-37(148px)로 정규화 */
  width: number;
  height: number;
  text: ReactNode;
};

// figma-loose: 일러스트 표시 높이는 카드별 148~156px → h-37(148px)로 통일(디자이너 교정 여지).
const CARDS: ShareCard[] = [
  {
    src: "/assets/f04-1.png",
    width: 320,
    height: 308,
    text: (
      <>
        1. 아래 버튼으로 <strong className="font-bold">내 링크</strong>를{" "}
        <strong className="font-bold text-blue-500">꼭</strong> 복사해줘!
      </>
    ),
  },
  {
    src: "/assets/f04-2.png",
    width: 440,
    height: 309,
    text: <>2. 친구들이 참여할 수 있게 링크를 보내줘!</>,
  },
  {
    src: "/assets/f04-3.png",
    width: 376,
    height: 317,
    text: (
      <>
        3. <strong className="font-bold text-blue-500">3명 이상</strong> 모이면,{" "}
        <strong className="font-bold text-blue-500">24시간 뒤</strong>{" "}
        <strong className="font-bold">내 링크</strong>로 와줘!
      </>
    ),
  },
];

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
            "flex motion-reduce:transition-none",
            animate && "transition-transform ease-out",
          )}
          style={{
            transform: `translateX(calc(${-index * 100}% + ${drag}px))`,
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
                i === activeReal ? "w-4 bg-gray-900" : "w-1.5 bg-gray-200",
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
      {/* figma-loose: 카드 radius 20px·backdrop-blur 10px 는 토큰 부재 → arbitrary(디자이너 검증 요망) */}
      <div className="flex h-76 w-full flex-col items-center justify-center gap-4 rounded-[20px] border border-white bg-white/40 backdrop-blur-[10px]">
        <div className="flex flex-col items-center gap-4">
          {/* figma-loose: 배지 = YPairingFont Bold 14px. 14px 디스플레이 토큰 부재 →
              size는 body-14-medium 차용 + font-bold로 weight 700 복원(Figma Bold 일치).
              tracking은 body(-0.03em) vs Figma(-0.02em) 미세차. → head2-14 토큰 신설은 디자이너 결정 대기. */}
          <span className="rounded-md bg-blue-100 px-3 py-1 font-display2 text-body-14-medium font-bold text-blue-500">
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
