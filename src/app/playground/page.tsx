import type { Metadata } from "next";

import { Logo } from "@/components/ui/logo";

import { ButtonSection } from "./_components/button-section";
import { ColorSection } from "./_components/color-section";
import { FeedbackSection } from "./_components/feedback-section";
import { FormSection } from "./_components/form-section";
import { FourCutsSection } from "./_components/four-cuts-section";
import { IconSection } from "./_components/icon-section";
import { RadiusSection } from "./_components/radius-section";
import { StatesSection } from "./_components/states-section";
import { TypographySection } from "./_components/typography-section";

export const metadata: Metadata = {
  title: "looky · 디자인 시스템 플레이그라운드",
  description:
    "looky의 디자인 토큰과 공용 컴포넌트를 한 화면에서 확인하고 공유하는 페이지",
};

// 디자인 시스템 플레이그라운드.
//
// 목적: 디자이너·프론트가 같은 화면을 보고 "이 토큰/컴포넌트가 맞나"를 검증하고,
//       링크로 공유해 합의하는 자리. 토큰 값의 진실 소스는 Figma → @theme.
//
// /style-guide 와의 관계: style-guide는 색·타이포만 다루고 hex를 하드코딩한 초기 화면이다.
//   이 페이지가 그 역할을 포함해 컴포넌트까지 덮고, 값은 런타임 조회로 읽는다.
//   → style-guide 제거 여부는 팀 확인 후 (docs/design-system-audit.md 참조).

/** 섹션 목차 — 섹션을 추가하면 여기에도 등록한다 */
const SECTIONS: { id: string; label: string }[] = [
  { id: "color", label: "색" },
  { id: "typography", label: "타이포" },
  { id: "radius", label: "Radius" },
  { id: "button", label: "버튼" },
  { id: "form", label: "폼" },
  { id: "feedback", label: "진행·안내" },
  { id: "icon", label: "아이콘·로고" },
  { id: "four-cuts", label: "인생네컷" },
  { id: "states", label: "상태 3종" },
];

export default function PlaygroundPage() {
  return (
    <main className="flex flex-col gap-10 px-5 py-8 pb-16">
      <header className="flex flex-col gap-3">
        <Logo />
        <div className="flex flex-col gap-1">
          <h1 className="font-display1 text-head1-24 text-gray-900">
            디자인 시스템 플레이그라운드
          </h1>
          <p className="text-body-14-regular text-gray-400">
            토큰과 공용 컴포넌트를 한 화면에서 확인합니다. 값은 실제 CSS 변수를
            읽어 표시하므로 <code className="text-gray-300">@theme</code> 과
            갈라지지 않습니다.
          </p>
        </div>
      </header>

      <nav aria-label="섹션 목차">
        <ul className="flex flex-wrap gap-2">
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-flex rounded-field border border-gray-100 px-3 py-1.5 text-caption-12-medium text-gray-400 transition-colors active:bg-gray-50"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ColorSection />
      <TypographySection />
      <RadiusSection />
      <ButtonSection />
      <FormSection />
      <FeedbackSection />
      <IconSection />
      <FourCutsSection />
      <StatesSection />

      <footer className="flex flex-col gap-2 border-t border-gray-100 pt-6">
        <p className="text-caption-12-medium text-gray-400">진실 소스</p>
        <ul className="flex flex-col gap-1 text-caption-12-regular text-gray-300">
          <li>토큰 값 — Figma Variables → globals.css @theme</li>
          <li>컴포넌트 사용 규칙 — shared/design-guide.md</li>
          <li>화면 스펙·상태 — shared/product-spec.md</li>
          <li>현황·미결 — docs/design-system-audit.md</li>
        </ul>
      </footer>
    </main>
  );
}
