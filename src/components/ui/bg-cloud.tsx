import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * BgCloud — 배경 구름 레이어 (디자이너 번들 이미지)
 *
 * Figma 소스: fileKey TRXXVUvIwh8vh7FbBusXCO — instance "bg_cloud" 484:15661 (390×240 @ y116)
 * 에셋: public/assets/bg_cloud.png (4x 1560×960, 흰색/투명 구름 → 하늘 그라데이션 위에 깔림)
 *
 * sky 배경 화면(F01 온보딩·F04 공유·F06 친구설문 등)에 공통 사용.
 * 부모(main)에 `bg-sky-gradient`와 `relative`가 있어야 한다(구름은 -z-10로 그라데이션과 콘텐츠 사이).
 *
 * figma-loose: top 위치는 F01 기준 116px(=top-29). 페이지별로 동일 가정 — 다르면 className으로 override.
 */
function BgCloud({ className }: { className?: string }) {
  return (
    <Image
      src="/assets/bg_cloud.png"
      alt=""
      aria-hidden
      width={390}
      height={240}
      priority
      className={cn(
        "pointer-events-none absolute inset-x-0 top-29 -z-10 h-auto w-full select-none",
        className,
      )}
    />
  )
}

export { BgCloud }
