"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent, useState } from "react";

import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";
import { TextfieldSet } from "@/components/ui/textfield-set";

// 닉네임 설정 (product-spec #2 · Figma F02 node 414:13283) — GUI 1차 전경 정합.
// 로컬에 임시 보관 후 자기 설문으로. 토큰 발급은 자기 설문 완료 시점(#3).
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
// TODO(✍️): 닉네임 금칙어 규칙 (계정 없어 중복검사 불필요).
// 길이 제한 = 8자 (디자이너 확정): 8자 초과 시 확인 버튼 비활성화.
const MAX_LEN = 8;

export default function NicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");

  const trimmed = nickname.trim();
  const tooLong = trimmed.length > MAX_LEN;
  const canSubmit = trimmed.length > 0 && !tooLong;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // 자기 설문으로 넘기며 닉네임 전달 (완료 시 토큰과 함께 로컬 저장)
    router.push(`/onboarding/survey?nickname=${encodeURIComponent(trimmed)}`);
  };

  // 여백(입력칸·버튼 외) 탭 시 키보드 내리기 — 입력/버튼 클릭은 각자 핸들러로 흘려보냄.
  const handleBackgroundClick = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("input, button")) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  // figma-loose: 로고 top Figma 80px(프레임, status bar 44px 포함) → pt-9(36px) 근사
  return (
    <main
      className="flex min-h-full flex-col px-5 pb-6 pt-9"
      onClick={handleBackgroundClick}
    >
      <Logo size="sm" />

      {/* figma-loose: 제목 블록 top Figma 136px(디자이너 교정) → 로고 아래 mt-8(32px) 근사, 제목↔본문 gap-3(12px) Figma 일치 */}
      <div className="mt-8 flex flex-col gap-3">
        {/* Figma: head-point1/24 = display1(Y Spotlight) 24px. (기존 display2에서 교정) */}
        <h1 className="text-head1-24 font-display1 text-gray-900">
          이름을 알려주세요
        </h1>
        {/* Figma: body/16-medium 16px Medium gray-300 (기존 14 regular에서 교정) */}
        <p className="text-body-16-medium text-gray-300">
          친구들이 설문에서 보게 될 이름이에요.
          <br />
          알아볼 수 있다면 별명도 좋아요.
        </p>
      </div>

      {/* figma-loose: 입력칸 top Figma 268px(디자이너 교정) → 제목 블록 아래 mt-9(36px) 근사 */}
      <div className="mt-9">
        <TextfieldSet
          isError={tooLong}
          description={tooLong ? `${MAX_LEN}자 이하로 입력해주세요` : undefined}
          inputProps={{
            value: nickname,
            onChange: (e) => setNickname(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleSubmit(),
            placeholder: "이름 또는 별명",
            "aria-label": "닉네임",
            maxLength: MAX_LEN + 4,
            // 화면 진입 시 키보드 활성화 (모바일은 브라우저 정책상 제스처 필요할 수 있음)
            autoFocus: true,
          }}
        />
      </div>

      {/* Figma: CTA 하단 여백 24px(디자이너 교정) → main pb-6(24px) 일치 */}
      <div className="mt-auto">
        <Cta onClick={handleSubmit} disabled={!canSubmit}>
          확인
        </Cta>
      </div>
    </main>
  );
}
