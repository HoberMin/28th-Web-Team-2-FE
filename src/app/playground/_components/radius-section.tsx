"use client";

import { Section, SpecNote, SubGroup, TokenValue } from "./spec";

// Radius·치수 토큰.
// 2026-08-19 에 Figma 실측값(7/9/14/18/20/21/40px 등)을 전부 토큰·스케일로 통일해
// 실코드의 arbitrary value 는 0건이다. 이 섹션은 "쓸 수 있는 것"을 눈에 보이게 해
// 다시 실측값이 새어 들어오지 않게 하는 목적.

interface RadiusToken {
  token: string;
  cls: string;
  varName: string;
  usage?: string;
}

const SEMANTIC: RadiusToken[] = [
  {
    token: "rounded-field",
    cls: "rounded-field",
    varName: "--radius-field",
    usage: "Textfield · BtnSurvey",
  },
  {
    token: "rounded-cta",
    cls: "rounded-cta",
    varName: "--radius-cta",
    usage: "Cta · CtaSmall",
  },
  {
    token: "rounded-card",
    cls: "rounded-card",
    varName: "--radius-card",
    usage: "공유 안내 카드(F04 캐러셀)",
  },
  {
    token: "rounded-app-frame",
    cls: "rounded-app-frame",
    varName: "--radius-app-frame",
    usage: "데스크탑 기기 프레임",
  },
];

const SCALE: RadiusToken[] = [
  { token: "rounded-sm", cls: "rounded-sm", varName: "--radius-sm" },
  { token: "rounded-md", cls: "rounded-md", varName: "--radius-md" },
  { token: "rounded-lg", cls: "rounded-lg", varName: "--radius-lg" },
  { token: "rounded-xl", cls: "rounded-xl", varName: "--radius-xl" },
  { token: "rounded-2xl", cls: "rounded-2xl", varName: "--radius-2xl" },
  { token: "rounded-3xl", cls: "rounded-3xl", varName: "--radius-3xl" },
  { token: "rounded-4xl", cls: "rounded-4xl", varName: "--radius-4xl" },
];

const WIDTHS: RadiusToken[] = [
  {
    token: "w-app-frame",
    cls: "w-app-frame",
    varName: "--width-app-frame",
    usage: "데스크탑 기기 프레임 폭 — 하단 고정바·모달이 이 값과 일치해야 한다",
  },
  {
    token: "w-logo-sm",
    cls: "w-logo-sm",
    varName: "--width-logo-sm",
    usage: "Logo size=sm",
  },
  {
    token: "w-logo-md",
    cls: "w-logo-md",
    varName: "--width-logo-md",
    usage: "Logo size=md",
  },
];

function RadiusGrid({ items }: { items: RadiusToken[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {items.map(({ token, cls, varName, usage }) => (
        <li key={token} className="flex flex-col gap-1">
          <div className={`h-12 w-full bg-blue-100 ${cls}`} />
          <p className="text-caption-12-medium text-gray-900">{token}</p>
          <TokenValue varName={varName} />
          {usage && (
            <p className="text-caption-12-regular text-gray-300">{usage}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RadiusSection() {
  return (
    <Section
      id="radius"
      title="Radius · 치수"
      description="의미 토큰을 먼저 찾고, 없을 때만 스케일을 쓴다."
    >
      <SubGroup label="의미 토큰 — 용도가 정해져 있다">
        <RadiusGrid items={SEMANTIC} />
      </SubGroup>

      <SubGroup label="스케일 — --radius 배수">
        <RadiusGrid items={SCALE} />
      </SubGroup>

      <SubGroup label="너비 토큰">
        <ul className="flex flex-col gap-2">
          {WIDTHS.map(({ token, cls, varName, usage }) => (
            <li key={token} className="flex flex-col gap-1">
              <div className={`h-6 rounded-sm bg-blue-100 ${cls}`} />
              <div className="flex items-baseline gap-2">
                <p className="text-caption-12-medium text-gray-900">{token}</p>
                <TokenValue varName={varName} />
              </div>
              {usage && (
                <p className="text-caption-12-regular text-gray-300">{usage}</p>
              )}
            </li>
          ))}
        </ul>
      </SubGroup>

      <SpecNote>
        radius 토큰은 Figma Variables 에 없어 코드에서 신설한 것입니다 — 디자이너
        확인 필요. Figma 실측값은 2026-08-19 에 전부 토큰·4px 그리드로 통일해
        실코드의 arbitrary value 는 <strong>0건</strong>입니다
        (docs/design-system-audit.md).
      </SpecNote>
    </Section>
  );
}
