import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Textfield — 텍스트 입력 필드 (350×60, radius 12px)
 *
 * Figma 소스: fileKey TRXXVUvIwh8vh7FbBusXCO
 *   focused     395:9845 — border blue-400
 *   entered     395:9848 — border gray-200
 *   placeholder 395:9846 — border gray-200, placeholder text gray-200
 *   error       395:9847 — border red-300
 *
 * 상태 매핑 (CSS 우선, prop 최소화)
 *   focused     → :focus-visible
 *   entered     → 기본(값 있는 상태는 CSS로 자연 표현)
 *   placeholder → placeholder: 의사 요소 (gray-200)
 *   error       → aria-invalid="true" → border red-300 / ring red-300/20
 *
 * 토큰 플래그:
 *   rounded-field(--radius-field: 0.75rem) — Figma radius 토큰 부재로 신설.
 *
 * 타이포: font-sans + text-body-16-medium (Pretendard 16px 500 lh1.5 -0.03em)
 */
const textfieldVariants = cva(
  [
    "block w-full",
    "rounded-field",         // --radius-field: 0.75rem (12px) — 신설 토큰
    "px-4 py-0 h-15",        // 350×60: h-15(60px), Figma px-4 → px-4(16px)
    "bg-white text-gray-900",
    "border border-gray-200",
    "font-sans text-body-16-medium",  // letter-spacing·line-height는 @theme --text-body-16-medium--* 자동 적용
    // placeholder
    "placeholder:text-gray-200",
    // focused
    "focus-visible:outline-none focus-visible:border-blue-400",
    // error (aria-invalid)
    "aria-invalid:border-red-300",
    "transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" ")
)

type TextfieldProps = Omit<React.ComponentProps<"input">, "size">

function Textfield({ className, ...props }: TextfieldProps) {
  return (
    <input
      data-slot="textfield"
      className={cn(textfieldVariants(), className)}
      {...props}
    />
  )
}

export { Textfield, textfieldVariants }
