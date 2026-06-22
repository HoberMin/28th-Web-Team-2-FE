"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

// 닉네임 설정 (product-spec #2) — 와이어프레임 초안. 로컬에 임시 보관 후 자기 설문으로.
// 실제 토큰 발급은 자기 설문 완료 시점(#3). 닉네임은 친구에게 보여지는 설문에 사용.
// TODO(✍️): 닉네임 길이·금칙어 규칙 (계정 없어 중복검사 불필요).
const MAX_LEN = 12;

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

  return (
    <main className="flex min-h-full flex-col px-5 pb-8 pt-16">
      <span className="text-head1-20 font-display1 text-blue-500">LOOKY</span>

      <div className="mt-8 flex flex-col gap-2">
        <h1 className="text-head2-24 font-display2 text-gray-900">
          당신의 이름을 알려주세요
        </h1>
        <p className="text-body-14-regular text-gray-300">
          친구에게 보여지는 설문에 사용돼요
          <br />
          누구인지 알아볼 수 있다면 별명도 괜찮아요
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="김루키"
          aria-label="닉네임"
          maxLength={MAX_LEN + 4}
          className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-body-16-medium text-gray-900 placeholder:text-gray-200 focus:border-blue-500 focus:outline-none"
        />
        {tooLong && (
          <p className="text-caption-12-regular text-red-300">
            {MAX_LEN}자 이하로 입력해주세요
          </p>
        )}
      </div>

      <div className="mt-auto">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-13 w-full rounded-2xl text-body-16-semibold"
        >
          확인
        </Button>
      </div>
    </main>
  );
}
