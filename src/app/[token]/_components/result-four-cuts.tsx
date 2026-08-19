"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { RefObject } from "react";

import { QUADRANTS, QUADRANT_LABEL } from "@data/quadrants";
import type { QuadrantKey } from "@data/quadrants";

// 인생네컷 2×2 다크 카드 (product-spec #6 핵심 비주얼 · Figma 414:13632).
// 각 칸은 button — 탭하면 확대 모달로 이어진다(onSelect).
// 빈 칸(imageUrl=null)은 안개 placeholder (domain.md 빈칸 정책 — 빈 화면이 아니라 대체 이미지).

interface ResultFourCutsProps {
  /** 칸별 AI 이미지 URL. 내용 없는 칸은 키 생략 또는 null */
  imageUrls: Partial<Record<QuadrantKey, string | null>>;
  /** "YYYY. MM. DD" — 빈 문자열이면 날짜 줄을 생략 */
  resultDate: string;
  /** 종합 키워드 — 없으면 캡션을 생략 */
  overallKeyword?: string | null;
  nickname: string;
  /** 모달로 확대된 칸 — 원본은 숨겨 layoutId 전환이 겹쳐 보이지 않게 한다 */
  selectedKey: QuadrantKey | null;
  onSelect: (key: QuadrantKey) => void;
  /** 탭 힌트 정렬 기준 — 첫 번째 카드 */
  firstCardRef?: RefObject<HTMLButtonElement | null>;
}

export function ResultFourCuts({
  imageUrls,
  resultDate,
  overallKeyword,
  nickname,
  selectedKey,
  onSelect,
  firstCardRef,
}: ResultFourCutsProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gray-900 px-3.5 pb-5 pt-5">
      <div className="grid grid-cols-2 gap-2.5">
        {QUADRANTS.map(({ key }, index) => {
          const imageUrl = imageUrls[key] ?? null;
          const label = QUADRANT_LABEL[key];
          return (
            <motion.button
              key={key}
              ref={index === 0 ? firstCardRef : undefined}
              type="button"
              layoutId={`f05-card-${key}`}
              aria-label={`${label} 자세히 보기`}
              onClick={() => onSelect(key)}
              onContextMenu={(e) => e.preventDefault()}
              style={{ visibility: selectedKey === key ? "hidden" : "visible" }}
              className="relative aspect-[160/218] overflow-hidden rounded-lg border border-white/15 bg-white"
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={`${label} — AI 생성 이미지`}
                  fill
                  // CDN 호스트 가변/미확정 → 최적화 비활성(remotePatterns 의존 제거)
                  unoptimized
                  draggable={false}
                  className="pointer-events-none object-cover select-none [-webkit-touch-callout:none]"
                  sizes="(max-width: 768px) 45vw, 165px"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gray-50">
                  <span className="text-body-16-medium text-gray-200" aria-hidden>
                    🌫️
                  </span>
                </div>
              )}
              {/* 칸 라벨 오버레이 (Figma Overlay: bg black/50) */}
              <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-1 text-caption-12-regular text-white">
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* 캡션: 날짜 + 종합 키워드 (Figma 414:13633) */}
      <div className="mt-3.5 flex flex-col items-center text-center">
        {resultDate && (
          <p className="text-body-14-regular text-gray-400">{resultDate}</p>
        )}
        {overallKeyword && (
          <p className="font-display1 text-head1-20 text-white">
            {overallKeyword} {nickname}
          </p>
        )}
      </div>
    </div>
  );
}
