"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { RefObject } from "react";

// F05 결과 본문 진입 1초 후 노출되는 "눌러봐" 힌트 오버레이 (Figma node 1268-7019).
// 첫 칸(모두가 아는 나)을 딤 위로 부각 + 말풍선 "내용이 궁금하다면 눌러봐!".
// 아무데나 탭 → dismiss(1회성, 재표시 없음). 장식적 힌트라 포커스 트랩 불필요.
//
// ⚠ Figma 절대좌표(top-137/left-30, 390 프레임·상태바 44 포함)를 그대로 쓰면 실기기(가변폭·상태바 없음)에서
//   실제 카드와 어긋난다 → 실제 첫 카드의 rect를 측정해 그 위에 정렬(반응형·상태바 무관).
// z: 힌트(z-50)가 footer(z-40)보다 위 → Figma press_me처럼 공유바도 함께 어두워짐.
interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ResultTapHintProps {
  /** 실제 첫 그리드 카드(모두가 아는 나) — 이 위치에 정렬 */
  anchorRef: RefObject<HTMLButtonElement | null>;
  firstCardImageUrl: string | null;
  firstCardLabel: string;
  onDismiss: () => void;
}

export function ResultTapHint({
  anchorRef,
  firstCardImageUrl,
  firstCardLabel,
  onDismiss,
}: ResultTapHintProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    function measure() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    measure();
    window.addEventListener("resize", measure);
    // 스크롤 시에도 재정렬(캡처 단계 — 내부 스크롤 컨테이너 포함)
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchorRef]);

  return (
    <button
      type="button"
      aria-label="힌트 닫기"
      onClick={onDismiss}
      className="fixed inset-0 z-50 bg-black/60"
    >
      {rect && (
        <>
          {/* 실제 첫 카드 위치에 정렬된 부각 카드 (딤 위) — Figma rounded-8·border white/15 */}
          <div
            className="pointer-events-none absolute overflow-hidden rounded-lg border border-white/15 bg-white"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          >
            {firstCardImageUrl ? (
              <Image
                src={firstCardImageUrl}
                alt=""
                aria-hidden
                fill
                unoptimized
                className="object-cover"
                sizes="160px"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gray-50">
                <span className="text-body-16-medium text-gray-200" aria-hidden>
                  🌫️
                </span>
              </div>
            )}
            {/* 라벨칩 — Figma 실측 bottom7/left7/py3 은 4px 그리드로 통일(bottom-2/left-2/py-1, 2026-08-19).
                result-four-cuts 의 같은 칩과 값이 일치해야 한다. */}
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-1 text-caption-12-regular text-white">
              {firstCardLabel}
            </span>
          </div>

          {/* 말풍선 — 삼각형 꼬리 끝이 카드 하단에서 12px 뜨도록.
              꼬리(size-3 rotate-45)가 박스 위로 ~8.5px 솟으므로 컨테이너 오프셋 = 12 + 8.5 ≈ 20 */}
          <div
            className="pointer-events-none absolute"
            style={{ top: rect.top + rect.height + 20, left: rect.left }}
          >
            <div className="relative">
              <div className="absolute -top-1.5 left-4 size-3 rotate-45 rounded-xs bg-gray-50" />
              <div className="rounded-full bg-gray-50 px-4 py-2">
                <p className="text-body-14-medium text-gray-800">
                  내용이 궁금하다면 눌러봐!
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </button>
  );
}
