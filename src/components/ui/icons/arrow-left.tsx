import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

// Figma: icn_arrow_left (24×24, stroke). 기본색 icon-default(currentColor 상속), className 으로 override.
function ArrowLeftIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("text-icon-default", className)}
      {...props}
    >
      <path
        d="M20.4 12H3.59998M10.8 4.79999L3.59998 12L10.8 19.2"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { ArrowLeftIcon }
