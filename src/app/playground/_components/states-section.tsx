"use client";

import { ResultStatusScreen } from "@/app/[token]/_components/result-status-screen";
import { Cta } from "@/components/ui/cta";

import { Section, SpecNote, SpecRow } from "./spec";

// 상태 3종 — 리뷰에서 가장 자주 빠지는 항목 (review-standard.md 필수 체크).
// 로딩 / 에러 / 빈 상태를 화면마다 손으로 만들지 않도록 ResultStatusScreen 을 쓴다.
// 여기서도 결과 화면과 같은 컴포넌트를 렌더한다.

/** 실제 화면은 전체 높이를 쓰지만, 플레이그라운드에선 칸 안에 담아 보여준다 */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-52 overflow-hidden rounded-field border border-gray-100 bg-white">
      {children}
    </div>
  );
}

export function StatesSection() {
  return (
    <Section
      id="states"
      title="상태 3종"
      description="로딩 · 에러 · 빈 상태. 리뷰에서 가장 자주 누락되는 항목이다."
    >
      <SpecRow
        name="로딩 — 이미지 생성 대기"
        usage="가장 중요한 로딩. 진행 표현이 필수 (product-spec #6)"
      >
        <Frame>
          <ResultStatusScreen
            spinner
            title="네컷을 만들고 있어요"
            description="잠시만 기다리면 결과가 나와요"
          />
        </Frame>
      </SpecRow>

      <SpecRow name="로딩 — 일반 조회" usage="스피너 + 안내 문구">
        <Frame>
          <ResultStatusScreen
            spinner
            title="결과를 불러오고 있어요"
            description="잠시만 기다려주세요"
          />
        </Frame>
      </SpecRow>

      <SpecRow name="에러" usage="원인 문구 + 재시도 액션을 반드시 함께">
        <Frame>
          <ResultStatusScreen
            title="결과를 불러오지 못했어요"
            description="네트워크 연결을 확인해주세요"
            action={<Cta>다시 시도</Cta>}
          />
        </Frame>
      </SpecRow>

      <SpecRow
        name="빈 상태 — 응답 0"
        usage="공유를 유도하는 문구로. 좌절감을 주지 않는다"
      >
        <Frame>
          <ResultStatusScreen
            title="첫 친구를 기다리는 중"
            description="링크를 공유하면 친구들이 답해줄 수 있어요"
          />
        </Frame>
      </SpecRow>

      <SpecNote>
        응답이 3건에 못 미쳐도 <strong>재시도 화면을 띄우지 않습니다</strong> — 수집
        화면에 계속 머무릅니다. 재시도는 AI 결과 생성이 실패했을 때
        (<code>resultStatus: FAILED</code>) 만입니다 (2026-07-05 확정).
      </SpecNote>
    </Section>
  );
}
