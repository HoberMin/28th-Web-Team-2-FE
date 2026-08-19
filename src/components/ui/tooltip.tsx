import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tooltip — 말풍선 안내 툴팁 (Figma 컴포넌트 node 832:14436)
 *
 * 구조:
 *   - 말풍선 본체(pill): bg-blue-900, text-gray-50, text-body-14-medium, px-4 py-2
 *     radius = rounded-full (figma-loose: Figma 21px → pill 높이 절반이라 rounded-full 동치)
 *   - 꼬리(tail): 아래 방향 삼각형, blue-900 동일 색
 *     Figma F04 배치 기준 꼬리가 말풍선 오른쪽(~80%)을 향해 다운로드 버튼 위를 가리킴
 *   - tailAlign prop: "left"|"center"|"right" (기본 "right") — 꼬리 수평 위치 제어
 *
 * 사용처: share-view.tsx 다운로드 버튼 위 상시 안내
 *   <Tooltip tailAlign="right">
 *     <b>인스타 스토리</b> 공유용 이미지 저장하기!
 *   </Tooltip>
 */
interface TooltipProps {
  children: ReactNode;
  tailAlign?: "left" | "center" | "right";
  className?: string;
}

function Tooltip({ children, tailAlign = "right", className }: TooltipProps) {
  // right: 꼬리 중심을 오른쪽 끝 64px(w-16) 아이콘 버튼의 중앙(32px)에 맞춤.
  // right-6(24px) + 꼬리 반폭(8px) = 32px = 버튼 정중앙.
  const tailPositionClass =
    tailAlign === "right"
      ? "right-6"
      : tailAlign === "left"
        ? "left-6"
        : "left-1/2 -translate-x-1/2";

  return (
    <div className={cn("relative w-fit", className)}>
      {/* 말풍선 본체 */}
      {/* figma-loose: Figma radius 21px → rounded-full (pill 높이의 절반과 동치라 외관 동일) */}
      <div className="rounded-full bg-blue-900 px-4 py-2 text-body-14-medium text-gray-50 whitespace-nowrap">
        {children}
      </div>

      {/* 꼬리 — 아래 방향 삼각형 (CSS border trick), blue-900 동일 색 */}
      {/* 꼬리 16×8px (border-x-8=반폭 8 → 폭 16, border-t-8=높이 8), blue-900.
          Figma Vector 22991 실측은 15.5×9였으나 4px 그리드로 통일(2026-08-19) — 시각차 1px 미만. */}
      <div
        className={cn(
          "absolute -bottom-2 h-0 w-0",
          "border-x-8 border-t-8 border-x-transparent border-t-blue-900",
          tailPositionClass,
        )}
        aria-hidden="true"
      />
    </div>
  );
}

export { Tooltip };
