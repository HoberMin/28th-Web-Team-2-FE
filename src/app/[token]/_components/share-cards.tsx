"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { usePreloadImages } from "@/lib/preload-images";

// 공유 안내 카드 캐러셀 (Figma F04 리디자인 · node 832:13771)
// 레이아웃: 가운데 활성 카드 풀사이즈 + 좌우 인접 카드 scale(0.8) peek.
//   ⮑ 사이드 카드는 별도 px를 박지 않고 활성 카드 스펙에 transform: scale(0.8)만 적용한다.
//      → 19.2/12.8/0.8px 같은 소수점 px가 발생하지 않아 토큰 정합성이 유지된다(활성 카드만 토큰으로 맞춤).
// 동작 스펙(사용자 확정):
//   1. 카드1 → 카드2 → 카드3 자동재생 2초, 다음 카드로 좌측 슬라이드
//   2. 무한 루프: 앞뒤로 클론을 1장씩 둬(앞=카드3, 뒤=카드1) 어느 방향이든 끊김 없이 순환
//   3. 자동/수동(스와이프) 전환 모두 인디케이터 동기화
// 접근성: prefers-reduced-motion 이면 자동재생·슬라이드 트랜지션을 끈다(수동 스와이프는 유지).

const AUTOPLAY_MS = 2000; // 카드당 노출 2초
const SLIDE_MS = 300; // 슬라이드 전환 시간
const SWIPE_THRESHOLD = 50; // 스와이프 인정 거리(px)
const GAP_PX = 16; // 카드 사이 간격(Figma 830:9452: 카드1↔카드2 16px) — 슬라이드 한 칸 이동량에 함께 반영
const SIDE_SCALE = 0.8; // 좌우 비활성 카드 축소율 (Figma 832:13771)
// Figma 830:9452 기준: 풀폭 뷰포트(390)에서 활성 카드 316px(=81%), 좌우 peek ~21px.
// 캐러셀은 share-view에서 -mx-5로 화면 끝까지 펼쳐진다.
// 사이드 카드 scale은 "안쪽(활성 카드 쪽) 모서리"를 기준점으로 축소하므로(아래 CardFrame transformOrigin),
// 카드를 넓게 둬도 peek이 사라지지 않는다.
const CARD_W_PCT = 81;
const SIDE_OFFSET_PCT = (100 - CARD_W_PCT) / 2; // 활성 카드를 가운데로 보내는 절반 여백(%)

type ShareCard = {
  n: number; // 단계 번호(뱃지)
  src: string;
  /** 일러스트 원본 크기(next/image 비율 계산용) — 표시 높이는 h-37(148px)로 정규화 */
  width: number;
  height: number;
  text: string;
};

// 일러스트는 카드 콘텐츠 폭(p-6 제외 ≈ 268px)에 w-full로 꽉 채운다 = Figma 캐릭터 268 width.
// (높이는 비율대로 자동 — 에셋마다 미세하게 다름. 에셋 높이 통일은 디자이너 재출력 시 확정.)
const CARDS: ShareCard[] = [
  {
    n: 1,
    src: "/assets/img_character_hamster_under.png",
    width: 1072,
    height: 615,
    text: "아래 버튼으로 내 링크를 꼭 복사해줘!",
  },
  {
    n: 2,
    src: "/assets/img_character_hamster_three.png",
    width: 1072,
    height: 615,
    text: "친구가 참여할 수 있게 링크를 보내줘!",
  },
  {
    n: 3,
    src: "/assets/img_character_hamster_clock.png",
    width: 1072,
    height: 638,
    text: "3명 이상 모이면 24시간 뒤 내 링크로 와!",
  },
];

// 2·3번 카드는 슬라이드되어 들어올 때 마운트되므로, 진입 즉시 세 장 모두 미리 받아둔다.
const PRELOAD_CARDS = CARDS.map(({ src, width, height }) => ({
  src,
  width,
  height,
}));

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

  // 클론 점프 직후(animate=false) 다음 페인트에서 트랜지션 복구.
  // 드래그 중에는 복구하지 않는다 — 복구되면 transition이 되살아나 손가락 추종이 SLIDE_MS만큼 지연됨.
  useEffect(() => {
    if (animate || dragging.current) return;
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

  const transitionDuration = animate ? `${SLIDE_MS}ms` : "0ms";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* 뷰포트 — 가로 클리핑(좌우 카드는 슬라이버만 보임). 세로 스크롤은 허용(touch-action) */}
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
            "flex items-center motion-reduce:transition-none",
            animate && "transition-transform ease-out",
          )}
          style={{
            gap: `${GAP_PX}px`,
            // 활성 카드(index)를 뷰포트 가운데로: 절반 여백 - (한 칸 폭 × index) - 누적 gap + 드래그
            transform: `translateX(calc(${SIDE_OFFSET_PCT}% - ${index * CARD_W_PCT}% - ${index * GAP_PX - drag}px))`,
            transitionDuration,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {SLIDES.map((card, i) => {
            // 양끝(클론)은 스크린리더에서 항상 숨김 — 활성화돼도 즉시 실카드로 점프하므로 중복 낭독 방지
            const isClone = i === 0 || i === SLIDES.length - 1;
            // 활성 기준 위치 — 사이드 카드는 활성 쪽(안쪽) 모서리를 기준으로 축소해야 peek이 안 사라짐
            const side: CardSide =
              i === index ? "center" : i < index ? "left" : "right";
            return (
              <CardFrame
                key={i}
                card={card}
                active={i === index}
                side={side}
                announce={i === index && !isClone}
                transitionDuration={transitionDuration}
              />
            );
          })}
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

type CardSide = "left" | "center" | "right";

// 사이드 카드 축소 기준점: 활성 카드를 향한 안쪽 모서리를 고정 → 축소해도 peek(빼꼼)이 유지됨.
const ORIGIN_BY_SIDE: Record<CardSide, string> = {
  left: "right center", // 왼쪽 카드는 오른쪽(안쪽) 모서리 고정
  right: "left center", // 오른쪽 카드는 왼쪽(안쪽) 모서리 고정
  center: "center",
};

function CardFrame({
  card,
  active,
  side,
  announce,
  transitionDuration,
}: {
  card: ShareCard;
  active: boolean;
  side: CardSide;
  announce: boolean;
  transitionDuration: string;
}) {
  return (
    // 한 칸 = 뷰포트의 CARD_W_PCT%. 비활성은 scale(0.8)로 축소(소수점 px 미발생 — 토큰 정합성 유지).
    <div
      className="shrink-0 select-none transition-transform ease-out motion-reduce:transition-none"
      style={{
        width: `${CARD_W_PCT}%`,
        transform: active ? "scale(1)" : `scale(${SIDE_SCALE})`,
        transformOrigin: ORIGIN_BY_SIDE[side],
        transitionDuration,
      }}
      aria-hidden={!announce}
    >
      {/* 카드 radius 20px·backdrop-blur 10px 는 raw px 유지(디자이너 합의 — 별도 토큰 미등록).
          테두리는 border 대신 inset ring(box-shadow 기반) — 콘텐츠 폭을 안 깎아 캐릭터가 정확히 268px(=316−패딩48).
          Figma 스트로크도 콘텐츠를 줄이지 않으므로 이쪽이 정합. */}
      <div className="flex flex-col items-center gap-6 rounded-[20px] bg-white/40 p-6 ring-1 ring-inset ring-white backdrop-blur-[10px]">
        <div className="flex w-full flex-col items-center gap-2">
          {/* 단계 뱃지 = blue/200 정사각 20px(size-5) + YPairingFont Bold 14px(head2-14) 흰 숫자. */}
          <span className="flex size-5 items-center justify-center rounded-[4px] bg-blue-200 font-display2 text-head2-14 text-white">
            {card.n}
          </span>
          {/* pill = 흰 배경 + blue/500 텍스트. Figma body/16-bold(Pretendard Bold 16, lh 1.55) 토큰 사용. */}
          <p className="rounded-md bg-white px-3 py-1 text-center text-body-16-bold text-blue-500">
            {card.text}
          </p>
        </div>
        <Image
          src={card.src}
          alt=""
          aria-hidden
          width={card.width}
          height={card.height}
          draggable={false}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
