import * as React from "react"

import { cn } from "@/lib/utils"
import { Textfield } from "@/components/ui/textfield"

/**
 * TextfieldSet — 라벨 + 필드 + 설명/에러 메시지 래퍼 (w-350, flex-col)
 *
 * Figma 소스: fileKey TRXXVUvIwh8vh7FbBusXCO
 *   default     395:9850 — textfield만 (gap 없음)
 *   description 395:9849 — gap-1(4px) + 하단 설명 텍스트 (text-body-16-medium, red-300)
 *   ※ Figma 레이어명 "discription"은 오타 → prop/코드는 description 로 통일
 *
 * 설명 텍스트색이 red-300이므로 에러 helper 목적 용도.
 * label prop을 두어 필드와 aria로 연결 (접근성).
 *
 * 타이포(description): font-sans + text-body-16-medium, -0.03em, red-300
 */

type TextfieldSetProps = {
  /** 입력 필드 id — label htmlFor·aria-describedby 연결에 사용. 미전달 시 useId로 자동 생성 */
  id?: string
  /** 라벨 텍스트 (옵션 — 없으면 렌더 안 함) */
  label?: string
  /** 에러/도움말 텍스트. 있으면 gap-1(4px) + red-300으로 하단 표시 */
  description?: string
  /** 에러 상태 — true이면 aria-invalid 전달 */
  isError?: boolean
  /** Textfield에 전달될 나머지 input props */
  inputProps?: Omit<React.ComponentProps<"input">, "id" | "aria-invalid" | "aria-describedby">
  className?: string
}

function TextfieldSet({
  id,
  label,
  description,
  isError = false,
  inputProps,
  className,
}: TextfieldSetProps) {
  const reactId = React.useId()
  const fieldId = id ?? reactId
  const descId = description ? `${fieldId}-desc` : undefined

  return (
    <div
      data-slot="textfield-set"
      className={cn("flex flex-col w-full", description ? "gap-1" : undefined, className)}
    >
      {label && (
        <label
          htmlFor={fieldId}
          className="font-sans text-body-16-medium text-gray-900"  /* letter-spacing·lh → @theme 자동 적용 */
        >
          {label}
        </label>
      )}
      <Textfield
        id={fieldId}
        aria-invalid={isError || undefined}
        aria-describedby={descId}
        {...inputProps}
      />
      {description && (
        <p
          id={descId}
          data-slot="textfield-description"
          className="font-sans text-body-16-medium text-red-300"  /* letter-spacing·lh → @theme 자동 적용 */
        >
          {description}
        </p>
      )}
    </div>
  )
}

export { TextfieldSet }
