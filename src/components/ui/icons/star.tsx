import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

// Figma: icn_star 단일 아이콘. 기본색 = icon-star(blue/400).
// 화면에서 색이 달라지면 색 className 만 override(currentColor 상속).
//   기본(파랑): <StarIcon /> · 핑크 활용: <StarIcon className="text-pink-300" />
// 원본의 미세 inner-shadow(0.3α·0.57px)는 아이콘 크기에서 보이지 않아 생략.
function StarIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("text-icon-star", className)}
      {...props}
    >
      <path
        d="M9.48678 3.03989C9.69672 2.61452 10.3033 2.61452 10.5132 3.03989L12.218 6.49412C12.3013 6.66303 12.4625 6.78011 12.6489 6.8072L16.4609 7.36111C16.9303 7.42932 17.1177 8.0062 16.778 8.33731L14.0197 11.026C13.8848 11.1575 13.8232 11.347 13.8551 11.5326L14.5063 15.3292C14.5864 15.7967 14.0957 16.1532 13.6758 15.9325L10.2663 14.14C10.0996 14.0524 9.90041 14.0524 9.73368 14.14L6.32415 15.9325C5.90428 16.1532 5.41356 15.7967 5.49375 15.3292L6.14491 11.5326C6.17675 11.347 6.1152 11.1575 5.98031 11.026L3.22195 8.33731C2.88227 8.0062 3.06971 7.42932 3.53914 7.36111L7.3511 6.8072C7.53751 6.78011 7.69866 6.66303 7.78202 6.49412L9.48678 3.03989Z"
        fill="currentColor"
      />
    </svg>
  )
}

export { StarIcon }
