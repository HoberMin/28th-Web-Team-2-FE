import type { ReactNode } from "react";

import { BgCloud } from "@/components/ui/bg-cloud";
import { cn } from "@/lib/utils";

/**
 * CenteredScreen — 가운데 정렬 히어로 화면 공통 골격
 *
 * 사용처: F01 온보딩 · F05 결과 게이트 · F06 친구설문(진입/완료) · F05 결과 실패.
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
  /** 배경 그라데이션 — sky(기본, 흰→blue-200) / gray(흰→gray-200, 실패·중립 화면) */
  background?: "sky" | "gray";
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
        "relative isolate flex min-h-full flex-col items-center px-5 pt-5 text-center",
        footer ? "pb-0" : "pb-6",
        background === "gray" ? "bg-gray-gradient" : "bg-sky-gradient",
        className,
      )}
    >
      <BgCloud />
      {/* 위 여백 가변 → 콘텐츠 세로 중앙 */}
      <div className="flex-1" aria-hidden />
      {children}
      <div className="flex-1" aria-hidden />
      {/* sticky — fixed 대신 스크롤 컨테이너 기준으로 붙어 iOS 브라우저 UI 변화에 튀지 않음 */}
      {footer && (
        <div className="sticky bottom-0 w-full pb-6 pt-3">
          {footer}
        </div>
      )}
    </main>
  );
}
