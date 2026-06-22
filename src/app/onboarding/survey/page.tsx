"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { SurveyRunner } from "@/components/survey/survey-runner";
import { createToken, saveSession } from "@/lib/local-session";
import { pickQuestions } from "@data/questions";

// 자기 설문 (product-spec #3) — 필수 선행. 조하리 "나 vs 친구"의 본인 쪽 데이터.
// 본인 설문은 "잘 모르겠어요" 중립 선택지 포함 (domain.md §2).
// 완료 → 링크 발급(로딩) → 토큰 생성·로컬 저장 → /[token] 공유 뷰.

function SelfSurvey() {
  const router = useRouter();
  const params = useSearchParams();
  const nickname = params.get("nickname")?.trim() || "나";
  const [issuing, setIssuing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const handleComplete = (_answers: Record<string, number>) => {
    // TODO(✍️): 본인 설문 응답(_answers)을 서버 제출 — 조하리 "나" 쪽 데이터 (domain.md §2).
    //           와이어프레임에선 더미라 미저장.
    // 링크 발급 로딩 (Figma: 로딩_공유 링크 발급중)
    setIssuing(true);
    const token = createToken();
    saveSession({ nickname, token, createdAt: Date.now() });
    // 발급 대기 흉내 후 이동 (정식: mutation onSuccess로 대체)
    timer.current = window.setTimeout(() => router.replace(`/${token}`), 900);
  };

  if (issuing) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
        <p className="text-body-16-medium text-gray-900">
          공유 링크를 만들고 있어요
        </p>
        <p className="text-body-14-regular text-gray-300">잠시만 기다려주세요</p>
      </div>
    );
  }

  return (
    <SurveyRunner
      questions={pickQuestions(8)}
      subjectLabel="나에 대해"
      includeNeutral
      onComplete={handleComplete}
      onBack={() => router.back()}
    />
  );
}

export default function SelfSurveyPage() {
  return (
    <Suspense fallback={null}>
      <SelfSurvey />
    </Suspense>
  );
}
