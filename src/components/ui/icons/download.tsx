import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

// Figma: icn_download (24×24, stroke). 기본색 icon-default(currentColor 상속), className 으로 override.
function DownloadIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
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
        d="M12 16.5V3.75M6.75 12L12 17.25L17.25 12M6.75 20.25H17.25"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { DownloadIcon }
