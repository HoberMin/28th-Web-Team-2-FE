"use client";

import { cn } from "@/lib/utils";
import { usePreloadImages } from "@/lib/preload-images";

import { ShareCardFrame } from "./share-card-frame";
import type { CardSide } from "./share-card-frame";
import {
  CARD_W_PCT,
  GAP_PX,
  SIDE_OFFSET_PCT,
} from "./share-cards.constants";
import { CARDS, PRELOAD_CARDS } from "./share-cards.data";
import { useShareCarousel } from "./use-share-carousel";

// 공유 안내 카드 캐러셀 (Figma F04 리디자인 · node 832:13771)
// 레이아웃: 가운데 활성 카드 풀사이즈 + 좌우 인접 카드 scale(0.8) peek.
// 동작(자동재생·무한 루프·스와이프·reduced-motion)은 useShareCarousel 이 담당하고
// 이 컴포넌트는 레이아웃·접근성 배선만 맡는다.

export function ShareCards() {
  const {
    index,
    activeReal,
    drag,
    animate,
    transitionDuration,
    slides,
    cardCount,
    goTo,
    handleTransitionEnd,
    pointerHandlers,
  } = useShareCarousel();

  // 캐러셀 카드 3장 선로딩 — 자동 슬라이드로 들어올 때 늦게 뜨지 않게
  usePreloadImages(PRELOAD_CARDS);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* 뷰포트 — 가로 클리핑(좌우 카드는 슬라이버만 보임). 세로 스크롤은 허용(touch-action) */}
      <div
        className="w-full overflow-hidden"
        style={{ touchAction: "pan-y" }}
        role="group"
        aria-roledescription="안내 카드"
        aria-label={`공유 안내 ${activeReal + 1}/${cardCount}`}
        {...pointerHandlers}
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
          {slides.map((card, i) => {
            // 양끝(클론)은 스크린리더에서 항상 숨김 — 활성화돼도 즉시 실카드로 점프하므로 중복 낭독 방지
            const isClone = i === 0 || i === slides.length - 1;
            // 활성 기준 위치 — 사이드 카드는 활성 쪽(안쪽) 모서리를 기준으로 축소해야 peek이 안 사라짐
            const side: CardSide =
              i === index ? "center" : i < index ? "left" : "right";
            return (
              <ShareCardFrame
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
