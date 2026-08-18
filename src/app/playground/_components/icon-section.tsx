"use client";

import type { SVGProps } from "react";

import { Logo } from "@/components/ui/logo";
import { ArrowLeftIcon } from "@/components/ui/icons/arrow-left";
import { DownloadIcon } from "@/components/ui/icons/download";
import { KakaoIcon } from "@/components/ui/icons/kakao";
import { LinkIcon } from "@/components/ui/icons/link";
import { StarIcon } from "@/components/ui/icons/star";

import { Section, SpecNote, SpecRow, SubGroup } from "./spec";

// 아이콘·로고.
// 아이콘 색은 fill="currentColor" 라서 text-* 로 바꾼다 → 시맨틱 토큰
// (text-icon-default / text-icon-muted / text-icon-star) 과 짝지어 쓴다.

const ICONS: {
  name: string;
  Icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
  /** 기본으로 물리는 시맨틱 색 토큰 */
  colorCls: string;
  colorToken: string;
}[] = [
  {
    name: "ArrowLeftIcon",
    Icon: ArrowLeftIcon,
    colorCls: "text-icon-default",
    colorToken: "icon-default",
  },
  {
    name: "DownloadIcon",
    Icon: DownloadIcon,
    colorCls: "text-icon-default",
    colorToken: "icon-default",
  },
  {
    name: "LinkIcon",
    Icon: LinkIcon,
    colorCls: "text-icon-muted",
    colorToken: "icon-muted",
  },
  {
    name: "StarIcon",
    Icon: StarIcon,
    colorCls: "text-icon-star",
    colorToken: "icon-star",
  },
  {
    name: "KakaoIcon",
    Icon: KakaoIcon,
    colorCls: "text-gray-900",
    colorToken: "gray-900 (브랜드 고정)",
  },
];

export function IconSection() {
  return (
    <Section
      id="icon"
      title="아이콘 · 로고"
      description="아이콘은 currentColor — text-* 시맨틱 토큰으로 색을 정한다."
    >
      <SubGroup label="아이콘 5종">
        <ul className="grid grid-cols-2 gap-2">
          {ICONS.map(({ name, Icon, colorCls, colorToken }) => (
            <li
              key={name}
              className="flex flex-col items-center gap-1 rounded-field border border-gray-100 p-3"
            >
              <Icon className={colorCls} aria-hidden />
              <p className="text-caption-12-medium text-gray-900">{name}</p>
              <p className="text-caption-12-regular text-gray-300">
                {colorToken}
              </p>
            </li>
          ))}
        </ul>
      </SubGroup>

      <SpecRow name="StarIcon · 색 override" usage="화면에서 다른 색이 필요할 때">
        <div className="flex items-center gap-3">
          <StarIcon className="text-icon-star" aria-hidden />
          <StarIcon className="text-pink-300" aria-hidden />
          <StarIcon className="text-gray-200" aria-hidden />
        </div>
      </SpecRow>

      <SpecRow name="Logo" usage="size=md 기본 / sm 은 결과 본문 헤더용">
        <div className="flex flex-col items-start gap-3">
          <Logo size="md" />
          <Logo size="sm" />
        </div>
      </SpecRow>

      <SpecNote>
        장식용 아이콘에는 <code>aria-hidden</code> 을, 아이콘만 있는 버튼에는
        <code>aria-label</code> 을 붙입니다 (CtaSmall · icon 참고).
      </SpecNote>
    </Section>
  );
}
