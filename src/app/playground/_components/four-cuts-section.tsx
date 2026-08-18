"use client";

import { useState } from "react";

import { ResultFourCuts } from "@/app/[token]/_components/result-four-cuts";
import { QUADRANTS, QUADRANT_LABEL } from "@data/quadrants";
import type { QuadrantKey } from "@data/quadrants";

import { Section, SpecNote, SpecRow, SubGroup } from "./spec";

// 제품의 핵심 비주얼 — 인생네컷 2×2 (domain.md §5).
// result-view 에서 분리한 ResultFourCuts 를 그대로 재사용한다. 화면과 플레이그라운드가
// 같은 컴포넌트를 쓰므로 여기서 확인한 것이 실제 결과 화면과 어긋나지 않는다.

/** 실제 AI 이미지 대신 로컬 캐릭터 에셋으로 채운 데모 */
const DEMO_IMAGES: Record<QuadrantKey, string | null> = {
  open: "/assets/img_character_hamster_star.png",
  blind: "/assets/img_character_hamster_film.png",
  hidden: "/assets/img_character_hamster_letter.png",
  unknown: null,
};

const EMPTY_IMAGES: Record<QuadrantKey, string | null> = {
  open: null,
  blind: null,
  hidden: null,
  unknown: null,
};

export function FourCutsSection() {
  const [selectedKey, setSelectedKey] = useState<QuadrantKey | null>(null);

  return (
    <Section
      id="four-cuts"
      title="인생네컷 (2×2)"
      description="제품의 핵심 비주얼. 결과 화면과 같은 컴포넌트를 그대로 렌더한다."
    >
      <SubGroup label="조하리 4칸 라벨 — 단일 소스 data/quadrants.ts">
        <ol className="flex flex-col gap-1">
          {QUADRANTS.map(({ key }, i) => (
            <li key={key} className="flex gap-2 text-body-14-regular">
              <span className="text-gray-300">{i + 1}</span>
              <span className="text-gray-900">{QUADRANT_LABEL[key]}</span>
              <code className="text-caption-12-regular text-gray-300">{key}</code>
            </li>
          ))}
        </ol>
      </SubGroup>

      <SpecRow
        name="ResultFourCuts · 3칸 채움 + 1칸 빈 칸"
        usage="빈 칸(주로 unknown)은 안개 placeholder — 빈 화면이 아니다"
      >
        <ResultFourCuts
          imageUrls={DEMO_IMAGES}
          resultDate="2026. 08. 18"
          overallKeyword="마음을 잘 여는"
          nickname="루키"
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
        <p className="text-caption-12-regular text-gray-300">
          {selectedKey
            ? `선택된 칸: ${QUADRANT_LABEL[selectedKey]} — 실제 화면에서는 확대 모달이 열린다`
            : "칸을 눌러보세요"}
        </p>
      </SpecRow>

      <SpecRow
        name="ResultFourCuts · 전부 빈 칸"
        usage="캡션(날짜·종합 키워드)이 없을 때의 모습"
      >
        <ResultFourCuts
          imageUrls={EMPTY_IMAGES}
          resultDate=""
          overallKeyword={null}
          nickname="루키"
          selectedKey={null}
          onSelect={() => {}}
        />
      </SpecRow>

      <SpecNote>
        데모 이미지는 로컬 캐릭터 에셋입니다. 실제로는 백엔드가 생성한 AI 이미지
        URL 이 들어오고 <code>unoptimized</code> 로 렌더됩니다. 결과 카피 톤은
        긍정/중립만 허용됩니다 (domain.md §1).
      </SpecNote>
    </Section>
  );
}
