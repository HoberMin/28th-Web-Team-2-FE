"use client";

import Image from "next/image";

import { CARD_W_PCT, SIDE_SCALE } from "./share-cards.constants";
import type { ShareCard } from "./share-cards.data";

// 캐러셀 한 칸(카드 프레임). 상태 없는 프레젠테이션 — 활성/사이드 여부만 props 로 받는다.

export type CardSide = "left" | "center" | "right";

// 사이드 카드 축소 기준점: 활성 카드를 향한 안쪽 모서리를 고정 → 축소해도 peek(빼꼼)이 유지됨.
const ORIGIN_BY_SIDE: Record<CardSide, string> = {
  left: "right center", // 왼쪽 카드는 오른쪽(안쪽) 모서리 고정
  right: "left center", // 오른쪽 카드는 왼쪽(안쪽) 모서리 고정
  center: "center",
};

interface ShareCardFrameProps {
  card: ShareCard;
  active: boolean;
  side: CardSide;
  /** 스크린리더에 낭독할지 — 클론은 false (같은 안내가 두 번 읽히는 것 방지) */
  announce: boolean;
  transitionDuration: string;
}

export function ShareCardFrame({
  card,
  active,
  side,
  announce,
  transitionDuration,
}: ShareCardFrameProps) {
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
      {/* 카드 모서리는 --radius-card(20px) 토큰. backdrop-blur 는 실측 10px 였으나
          Tailwind blur 스케일의 md(12px)로 통일(2026-08-19).
          테두리는 border 대신 inset ring(box-shadow 기반) — 콘텐츠 폭을 안 깎아 캐릭터가 정확히 268px(=316−패딩48).
          Figma 스트로크도 콘텐츠를 줄이지 않으므로 이쪽이 정합. */}
      <div className="flex flex-col items-center gap-6 rounded-card bg-white/40 p-6 ring-1 ring-inset ring-white backdrop-blur-md">
        <div className="flex w-full flex-col items-center gap-2">
          {/* 단계 뱃지 = blue/200 정사각 20px(size-5) + YPairingFont Bold 14px(head2-14) 흰 숫자. */}
          <span className="flex size-5 items-center justify-center rounded-sm bg-blue-200 font-display2 text-head2-14 text-white">
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
