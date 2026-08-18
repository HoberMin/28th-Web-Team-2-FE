import type { Metadata } from "next";

import { Logo } from "@/components/ui/logo";

import { ColorSection } from "./_components/color-section";

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
const SECTIONS: { id: string; label: string }[] = [{ id: "color", label: "색" }];

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

      {SECTIONS.length > 0 && (
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
      )}

      <ColorSection />

      <p className="text-body-14-regular text-gray-300">
        섹션을 순차적으로 옮겨 담고 있습니다.
      </p>
    </main>
  );
}
