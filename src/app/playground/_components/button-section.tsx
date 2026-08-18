"use client";

import { useState } from "react";

import { BtnSurvey } from "@/components/ui/btn-survey";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { DownloadIcon } from "@/components/ui/icons/download";

import { Section, SpecNote, SpecRow } from "./spec";

// 버튼 3종. variant 별 "언제 쓰는가"를 함께 적는다 — 임의 변형을 막는 근거
// (design-guide.md §3: 같은 컴포넌트의 화면별 변형은 variant 로 명시).

export function ButtonSection() {
  // BtnSurvey 는 선택 상태를 눌러서 확인할 수 있게 실제로 동작시킨다
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <Section
      id="button"
      title="버튼"
      description="주 CTA · 보조 CTA · 설문 보기 3계열. 눌러서 상태를 확인할 수 있다."
    >
      <SpecRow name="Cta" usage="화면당 1개 주 액션. 전폭 고정(w-full), 높이 56px">
        <Cta>내 네컷 결과 보기</Cta>
        <Cta disabled>비활성 (disabled)</Cta>
      </SpecRow>

      <SpecRow
        name="CtaSmall · stroke"
        usage="보조 액션 — 인스타 스토리 공유 등 테두리형"
      >
        <CtaSmall variant="stroke">인스타 스토리 공유</CtaSmall>
      </SpecRow>

      <SpecRow
        name="CtaSmall · stroke_icn"
        usage="아이콘 + 텍스트 테두리형 — 링크 복사"
      >
        <CtaSmall variant="stroke_icn" className="border-gray-100">
          링크 복사하기
        </CtaSmall>
      </SpecRow>

      <SpecRow name="CtaSmall · fill" usage="카카오톡 공유 전용 (bg-kakao)">
        <CtaSmall variant="fill">카카오톡 공유하기</CtaSmall>
      </SpecRow>

      <SpecRow name="CtaSmall · icon" usage="아이콘 전용 64×56 — 이미지 저장">
        <CtaSmall variant="icon" aria-label="이미지 저장">
          <DownloadIcon />
        </CtaSmall>
      </SpecRow>

      <SpecRow
        name="BtnSurvey"
        usage="설문 5지선다 보기. 최소 높이 64px, 두 줄 이상이면 확장"
      >
        {["혼자 조용히 생각을 정리한다", "친구에게 바로 전화해서 털어놓는다"].map(
          (label, i) => (
            <BtnSurvey
              key={label}
              isActive={picked === i}
              onClick={() => setPicked(i)}
            >
              {label}
            </BtnSurvey>
          ),
        )}
        <BtnSurvey disabled>비활성 (disabled)</BtnSurvey>
      </SpecRow>

      <SpecNote>
        모든 버튼은 <code>focus-visible:ring-2 ring-blue-400</code> 로 키보드
        포커스를 표시합니다. 터치 영역은 최소 높이 56px(Cta) / 64px(BtnSurvey)
        입니다.
      </SpecNote>
    </Section>
  );
}
