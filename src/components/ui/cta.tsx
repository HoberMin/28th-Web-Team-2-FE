import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * CTA — 큰 버튼 (350×56, radius 16px)
 *
 * Figma 소스: fileKey TRXXVUvIwh8vh7FbBusXCO
 *   default  395:9840 · disabled 395:9841 · pressed 395:9842
 *
 * 상태 매핑
 *   default   → 기본
 *   disabled  → :disabled (HTML attribute / prop)
 *   pressed   → active: (CSS 상태 셀렉터)
 *
 * 타이포: font-display1 + text-head1-18 (Y SpotlightOTF 18px lh1.5 -0.02em)
 */
const ctaVariants = cva(
  [
    "inline-flex w-full shrink-0 items-center justify-center",
    "rounded-cta",          // --radius-cta: 1rem (16px) — 신설 토큰
    "px-2 py-0 h-14",       // 350×56: h-14(56px), Figma p-2 → px-2(8px). w-full+center라 수평 패딩 영향 미미
    "font-display1 text-head1-18",  // letter-spacing·line-height는 @theme --text-head1-18--* 자동 적용
    "transition-colors select-none outline-none whitespace-nowrap",
    "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
    "disabled:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gray-900 text-white",
          "active:bg-gray-800",                 // pressed: gray-800
          "disabled:bg-gray-200 disabled:text-white",  // disabled: gray-200, text white 유지(명시)
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Cta({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof ctaVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="cta"
      data-variant={variant}
      className={cn(ctaVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Cta, ctaVariants }
