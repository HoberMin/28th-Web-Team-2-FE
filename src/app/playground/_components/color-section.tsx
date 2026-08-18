"use client";

import { Section, SpecNote, SubGroup, TokenValue } from "./spec";

// 색 토큰 전량. @theme 의 --color-* 와 1:1 로 맞춘다.
// 값은 적지 않고 TokenValue 가 런타임에 읽는다 (진실 소스: Figma → @theme).

interface Swatch {
  /** Tailwind 토큰명 (= 클래스 접미사) */
  token: string;
  /** 배경 클래스 — 화이트리스트 안의 토큰만 */
  cls: string;
  /** 대응하는 CSS 변수 */
  varName: string;
  /** 어디에 쓰는지 */
  usage?: string;
}

const GROUPS: { label: string; swatches: Swatch[] }[] = [
  {
    label: "gray — 텍스트·배경 기본",
    swatches: [
      { token: "white", cls: "bg-white border border-gray-100", varName: "--color-white" },
      { token: "gray-50", cls: "bg-gray-50", varName: "--color-gray-50" },
      { token: "gray-100", cls: "bg-gray-100", varName: "--color-gray-100" },
      { token: "gray-200", cls: "bg-gray-200", varName: "--color-gray-200" },
      { token: "gray-300", cls: "bg-gray-300", varName: "--color-gray-300" },
      { token: "gray-400", cls: "bg-gray-400", varName: "--color-gray-400" },
      { token: "gray-700", cls: "bg-gray-700", varName: "--color-gray-700" },
      { token: "gray-800", cls: "bg-gray-800", varName: "--color-gray-800" },
      { token: "gray-900", cls: "bg-gray-900", varName: "--color-gray-900" },
    ],
  },
  {
    label: "blue — 주 강조색",
    swatches: [
      { token: "blue-100", cls: "bg-blue-100", varName: "--color-blue-100" },
      { token: "blue-200", cls: "bg-blue-200", varName: "--color-blue-200" },
      { token: "blue-300", cls: "bg-blue-300", varName: "--color-blue-300" },
      { token: "blue-400", cls: "bg-blue-400", varName: "--color-blue-400" },
      { token: "blue-500", cls: "bg-blue-500", varName: "--color-blue-500" },
      { token: "blue-900", cls: "bg-blue-900", varName: "--color-blue-900" },
    ],
  },
  {
    label: "강조·상태",
    swatches: [
      { token: "red-300", cls: "bg-red-300", varName: "--color-red-300", usage: "에러·유효성" },
      { token: "pink-300", cls: "bg-pink-300", varName: "--color-pink-300" },
      { token: "yellow-200", cls: "bg-yellow-200", varName: "--color-yellow-200" },
      { token: "yellow-800", cls: "bg-yellow-800", varName: "--color-yellow-800" },
      { token: "green-200", cls: "bg-green-200", varName: "--color-green-200" },
      { token: "green-300", cls: "bg-green-300", varName: "--color-green-300" },
    ],
  },
  {
    label: "시맨틱 — 아이콘 (다른 토큰을 가리킨다)",
    swatches: [
      {
        token: "icon-default",
        cls: "bg-icon-default",
        varName: "--color-icon-default",
        usage: "icn_arrow_left · icn_download",
      },
      {
        token: "icon-muted",
        cls: "bg-icon-muted",
        varName: "--color-icon-muted",
        usage: "icn_link",
      },
      {
        token: "icon-star",
        cls: "bg-icon-star",
        varName: "--color-icon-star",
        usage: "icn_star — 화면에서 override 가능",
      },
    ],
  },
  {
    label: "브랜드",
    swatches: [
      {
        token: "kakao",
        cls: "bg-kakao",
        varName: "--color-kakao",
        usage: "카카오톡 공유 버튼 전용",
      },
    ],
  },
];

export function ColorSection() {
  return (
    <Section
      id="color"
      title="색"
      description="Tailwind 기본 팔레트는 @theme 에서 리셋했다 — 여기 있는 토큰만 쓸 수 있다."
    >
      {GROUPS.map(({ label, swatches }) => (
        <SubGroup key={label} label={label}>
          <ul className="grid grid-cols-3 gap-2">
            {swatches.map(({ token, cls, varName, usage }) => (
              <li key={token} className="flex flex-col gap-1">
                <div className={`h-12 w-full rounded-field ${cls}`} />
                <p className="text-caption-12-medium text-gray-900">{token}</p>
                <TokenValue varName={varName} />
                {usage && (
                  <p className="text-caption-12-regular text-gray-300">
                    {usage}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SubGroup>
      ))}

      <SpecNote>
        <strong>kakao</strong> 는 Figma Variables 화이트리스트 밖에서 코드가 신설한
        토큰입니다 — 디자이너 확인 필요.
      </SpecNote>
    </Section>
  );
}
