import type { ReactNode } from "react";

import { BgCloud } from "@/components/ui/bg-cloud";
import { cn } from "@/lib/utils";

/**
 * CenteredScreen — 가운데 정렬 히어로 화면 공통 골격
 *
 * 사용처: F01 온보딩 · F05 결과 게이트 · F06 친구설문(진입/완료) · F05 결과 실패 · F05 AI생성중 로딩.
 *
 * 공통(여기서 단일 소스화):
 *   - 좌우 패딩 px-5(20px) · 상하 기본 pt-5(20px)/pb-6(24px)
 *   - 상하 flex-1 스페이서로 콘텐츠를 세로 중앙에 두고 화면 높이에 따라 호흡
 *   - 배경 그라데이션(sky/gray) + BgCloud
 *
 * 페이지는 가운데 콘텐츠(children)와 하단 고정 블록(footer)만 채운다.
 * 콘텐츠 내부 요소 간격(gap-*)은 화면마다 다르므로 children 쪽에서 지정.
 *
 * ※ 풀블리드 화면(F03 설문 · F05 결과 본문)은 진행바/공유바가 화면 끝까지 가야 해
 *    이 골격을 쓰지 않는다(개별 레이아웃). 폼 화면(F02)도 상단 정렬이라 별도.
 */
type CenteredScreenProps = {
  /** 배경 그라데이션 — sky(기본, 흰→blue-200) / gray(흰→gray-200, 실패·중립 화면) / green(흰→green-200, AI생성중 로딩) */
  background?: "sky" | "gray" | "green";
  /** 가운데 정렬 콘텐츠 (로고/타이틀/이미지 블록) */
  children: ReactNode;
  /** 하단 고정 블록 (CTA·안내문 등) */
  footer?: ReactNode;
  className?: string;
};

export function CenteredScreen({
  background = "sky",
  children,
  footer,
  className,
}: CenteredScreenProps) {
  return (
    <main
      className={cn(
        "relative isolate flex h-full flex-col px-5 text-center",
        background === "gray" && "bg-gray-gradient",
        background === "green" && "bg-green-gradient",
        background === "sky" && "bg-sky-gradient",
        className,
      )}
    >
      <BgCloud />
      {/* 콘텐츠 영역 — h-full 전체 차지(footer가 absolute라 flow에서 제외).
          pb-[92px]: footer 오버레이 높이(pt-3 12 + h-14 56 + pb-6 24)만큼 하단 여백 확보.
          콘텐츠가 길면 이 영역 안에서만 스크롤 → footer는 항상 그 위에 고정. */}
      <div
        className={cn(
          "flex flex-1 flex-col items-center overflow-y-auto scrollbar-hide bg-transparent pt-5",
          footer ? "pb-[92px]" : "pb-6",
        )}
      >
        <div className="flex-1" aria-hidden />
        {children}
        <div className="flex-1" aria-hidden />
      </div>
      {/* 하단 CTA — absolute 오버레이. 콘텐츠 스크롤과 무관하게 항상 화면 하단 고정.
          inset-x-0: 부모 px-5 패딩 박스 기준 좌우 0 → 버튼이 px-5 영역 안에 위치. */}
      {footer && (
        <div className="absolute inset-x-5 bottom-0 pb-6 pt-3">
          {footer}
        </div>
      )}
    </main>
  );
}
