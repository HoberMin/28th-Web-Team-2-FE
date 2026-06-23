import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { LinkIcon } from "@/components/ui/icons/link"

/**
 * CTA_small — 공유 버튼 (171×56, radius 16px)
 *
 * Figma 소스: fileKey TRXXVUvIwh8vh7FbBusXCO
 *   stroke     414:13236 — 인스타 스토리 공유 (border gray-200, bg white)
 *   stroke_icn 414:13238 — 아이콘 + 텍스트 (border gray-200, bg white, lucide Link)
 *   fill       414:13237 — 카카오톡 공유 (bg kakao, text gray-900)
 *
 * CTA_insta 통합 안내:
 *   Figma 인스턴스 395:9844 확인 결과 CTA_small stroke variant와 완전 동일.
 *   별도 컴포넌트 없이 <CtaSmall variant="stroke" /> 로 대체.
 *
 * 아이콘 처리 (브랜드 SVG 부재 → 레포 자체 아이콘 사용):
 *   stroke_icn → icons/link 의 LinkIcon (Figma icn_link 45° 링크 아이콘), currentColor 상속
 *   fill(카카오) → Figma F04 기준 텍스트만(심볼 없음). icons/kakao 의 KakaoIcon 에셋은 준비됐으나
 *                 미사용 — 넣을지는 디자이너 합의(CTA_kakao 컴포넌트 확인 후). figma-loose 참조.
 *
 * 토큰 플래그:
 *   bg-kakao(--color-kakao: #fee500) — 화이트리스트 밖 신설. 디자이너 검증 요망.
 *   rounded-cta(--radius-cta: 1rem) — Figma radius 토큰 부재로 신설.
 *
 * 타이포: font-display1 + text-head1-16 (Y SpotlightOTF 16px lh1.5 -0.02em)
 */
const ctaSmallVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-0.5",
    "rounded-cta",          // --radius-cta: 1rem (16px) — 신설 토큰
    "h-14",                 // 56px
    "font-display1 text-head1-16",  // letter-spacing·line-height는 @theme --text-head1-16--* 자동 적용
    "transition-colors select-none outline-none whitespace-nowrap",
    "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        /**
         * stroke — 테두리형 (인스타 스토리 공유 / CTA_insta 통합)
         * Figma px-[20px] → px-5(20px), border gray-200, bg white, text gray-900
         */
        stroke: "bg-white border border-gray-200 text-gray-900 px-5",

        /**
         * stroke_icn — 아이콘 포함 테두리형
         * Figma pl-[12px] pr-[16px] → pl-3 pr-4, gap-[2px] → gap-0.5(base)
         * border gray-200, bg white, text gray-900, lucide Link 24px
         */
        stroke_icn: "bg-white border border-gray-200 text-gray-900 pl-3 pr-4",

        /**
         * fill — 채움형 (카카오톡 공유)
         * Figma px-[20px] → px-5(20px), bg-kakao(#fee500), text gray-900
         */
        fill: "bg-kakao text-gray-900 px-5",
      },
    },
    defaultVariants: {
      variant: "stroke",
    },
  }
)

function CtaSmall({
  className,
  variant = "stroke",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof ctaSmallVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="cta-small"
      data-variant={variant}
      className={cn(ctaSmallVariants({ variant, className }))}
      {...props}
    >
      {variant === "stroke_icn" && (
        <LinkIcon className="shrink-0 text-gray-900" />
      )}
      {/* figma-loose: fill(카카오) 버튼은 Figma F04 기준 텍스트만(심볼 없음).
          icons/kakao 의 KakaoIcon 에셋은 준비됨 — 넣을지는 디자이너 합의(CTA_kakao 컴포넌트 확인 후) */}
      {children}
    </Comp>
  )
}

export { CtaSmall, ctaSmallVariants }
