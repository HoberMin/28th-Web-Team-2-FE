"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCreateSurveyAPI } from "@/apis/survey/mutations";
import { isApiError } from "@/apis/error";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { saveSession } from "@/lib/local-session";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";
import { TextfieldSet } from "@/components/ui/textfield-set";

// 닉네임 설정 (product-spec #2 · Figma F02 node 414:13283) — GUI 1차 전경 정합.
// 확인 클릭 시 survey 생성 API 호출 → surveyCode를 로컬에 저장 → 자기 설문으로.
// TODO(✍️): 닉네임 길이·금칙어 규칙 (계정 없어 중복검사 불필요).
const MAX_LEN = 10;

export default function NicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const { mutate, isPending } = useCreateSurveyAPI();
  const keyboardInset = useKeyboardInset();

  const trimmed = nickname.trim();
  const tooLong = trimmed.length > MAX_LEN;
  const canSubmit = trimmed.length > 0 && !tooLong && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setServerError(null);

    mutate(
      { userNickname: trimmed },
      {
        onSuccess: (payload) => {
          saveSession({
            nickname: payload.userNickname,
            surveyCode: payload.surveyCode,
            createdAt: Date.now(),
          });
          router.push("/onboarding/survey");
        },
        onError: (error) => {
          if (isApiError(error)) {
            const msg =
              error.fieldErrors?.[0]?.reason ?? error.message;
            setServerError(msg);
          } else {
            setServerError("오류가 발생했어요. 다시 시도해주세요.");
          }
        },
      },
    );
  };

  const hasError = tooLong || !!serverError;
  const errorMessage = tooLong
    ? `${MAX_LEN}자 이하로 입력해주세요`
    : (serverError ?? undefined);

  // figma-loose: 로고 top Figma 80px(프레임, status bar 44px 포함) → pt-9(36px) 근사
  return (
    <main className="flex min-h-full flex-col px-5 pb-8 pt-9">
      <Logo size="sm" />

      {/* figma-loose: 제목 블록 top Figma 138px → 로고 아래 mt-8(32px) 근사(Figma 간격 ≈34.5px), 제목↔본문 gap-3(12px) Figma 일치 */}
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

      {/* figma-loose: 입력칸 top Figma 269px → 제목 블록 아래 mt-8(32px) 근사 */}
      <div className="mt-8">
        <TextfieldSet
          isError={hasError}
          description={errorMessage}
          inputProps={{
            value: nickname,
            onChange: (e) => {
              setNickname(e.target.value);
              if (serverError) setServerError(null);
            },
            onKeyDown: (e) => e.key === "Enter" && handleSubmit(),
            placeholder: "이름 또는 별명",
            "aria-label": "닉네임",
            maxLength: MAX_LEN + 4,
            disabled: isPending,
            // 화면 진입 시 키보드 활성화 (F02 요청). iOS Safari는 사용자 제스처 없는
            // 프로그램적 포커스로 키보드를 안 띄울 수 있음 — 플랫폼 한계.
            autoFocus: true,
          }}
        />
      </div>

      {/* figma-loose: CTA 영역 Figma pb 34px → main pb-8(32px, -2px) 근사 */}
      {/* 키보드 따라 버튼 올라오게 (F02 요청): visualViewport로 잰 키보드 높이만큼 위로 */}
      <div
        className="mt-auto transition-transform duration-200 ease-out"
        style={{ transform: `translateY(-${keyboardInset}px)` }}
      >
        <Cta onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? "만드는 중..." : "확인"}
        </Cta>
      </div>
    </main>
  );
}
