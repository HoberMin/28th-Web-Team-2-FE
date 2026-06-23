import * as React from "react"
import { cva } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * BtnSurvey — 설문 보기 버튼 (350×64, radius 12px, 텍스트 좌측 정렬)
 *
 * Figma 소스: fileKey TRXXVUvIwh8vh7FbBusXCO
 *   default   395:9851 — bg white, text gray-400, Figma pl-[16px] pr-[20px] → pl-4 pr-5
 *   activated 395:9852 — bg gray-800, text white, Figma px-[20px] → px-5
 *
 * 상태 매핑
 *   activated → isActive prop 단일 소스. isActive=true이면
 *   aria-pressed="true" + data-state="active" + activated 스타일을 함께 부여.
 *   (시각 상태와 시맨틱 상태가 어긋나지 않도록 단일 prop에서 파생)
 *
 * 토큰 플래그:
 *   rounded-field(--radius-field: 0.75rem) — Figma radius 토큰 부재로 신설.
 *
 * 타이포: font-sans + text-body-16-medium (Pretendard 16px 500 lh1.5 -0.03em)
 */
const btnSurveyVariants = cva(
  [
    "inline-flex w-full shrink-0 items-center",
    "rounded-field",         // --radius-field: 0.75rem (12px) — 신설 토큰
    "h-16",                  // 64px
    "font-sans text-body-16-medium",  // letter-spacing·line-height는 @theme --text-body-16-medium--* 자동 적용
    "transition-colors select-none outline-none",
    "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      state: {
        /**
         * default — 미선택 상태
         * bg white, text gray-400, Figma pl-[16px] pr-[20px] → pl-4 pr-5
         */
        default: "bg-white text-gray-400 pl-4 pr-5",

        /**
         * activated — 선택된 상태 (aria-pressed="true")
         * bg gray-800, text white, Figma px-[20px] → px-5
         */
        activated: "bg-gray-800 text-white px-5",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
)

type BtnSurveyProps = React.ComponentProps<"button"> & {
  asChild?: boolean
  /** 선택 여부 — true이면 aria-pressed + data-state="active" + activated 스타일 */
  isActive?: boolean
}

function BtnSurvey({
  className,
  isActive = false,
  asChild = false,
  ...props
}: BtnSurveyProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="btn-survey"
      data-state={isActive ? "active" : "inactive"}
      aria-pressed={isActive}
      className={cn(
        btnSurveyVariants({ state: isActive ? "activated" : "default", className })
      )}
      {...props}
    />
  )
}

export { BtnSurvey, btnSurveyVariants }
