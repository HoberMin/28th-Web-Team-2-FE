"use client";

import { Section, SpecNote, SubGroup, TokenValue } from "./spec";

// 타이포 토큰. text-* 토큰은 크기뿐 아니라 line-height·letter-spacing 까지 함께 물고 있어
// (--text-*--line-height / --text-*--letter-spacing), 클래스 하나로 조판이 완성된다.
// → 화면에서 tracking-*/leading-* 를 덧붙이면 토큰이 정한 조판을 깨뜨린다.

const SAMPLE = "친구들이 본 나를 인생네컷으로";

interface TypeToken {
  /** 표기용 토큰명 (Figma 표기와 맞춘다) */
  token: string;
  /** 적용 클래스 — font-* 와 text-* 를 짝지어 쓴다 */
  cls: string;
  varName: string;
}

const GROUPS: {
  label: string;
  /** 이 그룹이 물고 있는 폰트 패밀리 */
  family: string;
  items: TypeToken[];
}[] = [
  {
    label: "head-point1",
    family: "font-display1 · Y SpotlightOTF",
    items: [
      { token: "head1/26", cls: "font-display1 text-head1-26", varName: "--text-head1-26" },
      { token: "head1/24", cls: "font-display1 text-head1-24", varName: "--text-head1-24" },
      { token: "head1/20", cls: "font-display1 text-head1-20", varName: "--text-head1-20" },
      { token: "head1/18", cls: "font-display1 text-head1-18", varName: "--text-head1-18" },
      { token: "head1/16", cls: "font-display1 text-head1-16", varName: "--text-head1-16" },
    ],
  },
  {
    label: "head-point2",
    family: "font-display2 · YPairingFont",
    items: [
      { token: "head2/26", cls: "font-display2 text-head2-26", varName: "--text-head2-26" },
      { token: "head2/24", cls: "font-display2 text-head2-24", varName: "--text-head2-24" },
      { token: "head2/20", cls: "font-display2 text-head2-20", varName: "--text-head2-20" },
      { token: "head2/18", cls: "font-display2 text-head2-18", varName: "--text-head2-18" },
      { token: "head2/16", cls: "font-display2 text-head2-16", varName: "--text-head2-16" },
      { token: "head2/14", cls: "font-display2 text-head2-14", varName: "--text-head2-14" },
    ],
  },
  {
    label: "body",
    family: "font-sans · Pretendard",
    items: [
      { token: "body/18-semibold", cls: "text-body-18-semibold", varName: "--text-body-18-semibold" },
      { token: "body/18-medium", cls: "text-body-18-medium", varName: "--text-body-18-medium" },
      { token: "body/18-regular", cls: "text-body-18-regular", varName: "--text-body-18-regular" },
      { token: "body/16-bold", cls: "text-body-16-bold", varName: "--text-body-16-bold" },
      { token: "body/16-semibold", cls: "text-body-16-semibold", varName: "--text-body-16-semibold" },
      { token: "body/16-medium", cls: "text-body-16-medium", varName: "--text-body-16-medium" },
      { token: "body/16-regular", cls: "text-body-16-regular", varName: "--text-body-16-regular" },
      { token: "body/14-medium", cls: "text-body-14-medium", varName: "--text-body-14-medium" },
      { token: "body/14-regular", cls: "text-body-14-regular", varName: "--text-body-14-regular" },
    ],
  },
  {
    label: "caption",
    family: "font-sans · Pretendard",
    items: [
      { token: "caption/12-medium", cls: "text-caption-12-medium", varName: "--text-caption-12-medium" },
      { token: "caption/12-regular", cls: "text-caption-12-regular", varName: "--text-caption-12-regular" },
    ],
  },
];

export function TypographySection() {
  return (
    <Section
      id="typography"
      title="타이포그래피"
      description="text-* 토큰 하나가 크기·행간·자간을 함께 정한다. leading-*·tracking-* 을 덧붙이지 않는다."
    >
      {GROUPS.map(({ label, family, items }) => (
        <SubGroup key={label} label={`${label} — ${family}`}>
          <ul className="flex flex-col">
            {items.map(({ token, cls, varName }) => (
              <li
                key={token}
                className="flex flex-col gap-1 border-b border-gray-100 py-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-caption-12-medium text-gray-400">
                    {token}
                  </span>
                  <TokenValue varName={varName} />
                </div>
                <span className={`${cls} text-gray-900`}>{SAMPLE}</span>
              </li>
            ))}
          </ul>
        </SubGroup>
      ))}

      <SpecNote>
        자간은 head 계열 −0.02em, body 계열 −0.03em 으로 토큰에 박혀 있습니다.
        Figma 의 % 표기를 em 으로 환산한 값입니다.
      </SpecNote>
    </Section>
  );
}
