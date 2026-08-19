"use client";

import { SurveyRunner } from "@/components/survey/survey-runner";
import { Cta } from "@/components/ui/cta";
import { usePreloadImages } from "@/lib/preload-images";

import { useSelfSurvey } from "./use-self-survey";

// 다음 화면(F04 공유) 캐릭터를 설문 푸는 동안 optimized URL로 미리 받아둔다.
// share-view는 next/image(optimized)로 요청하므로, raw png가 아니라 최적화 URL을 데워야 캐시 적중.
const PRELOAD_SHARE_ILLUST = [
  { src: "/assets/img_character_hamster_set.png", width: 1072, height: 615 },
];

// 자기 설문 (product-spec #3) — 필수 선행. 조하리 "나 vs 친구"의 본인 쪽 데이터.
// 문항 확보(캐시/복구/API)·제출·전환은 useSelfSurvey 가 맡고, 여기선 화면만 고른다.

/** 문구 + 재시도 버튼 한 벌 — 이 화면의 에러 3종이 같은 모양을 쓴다 */
function RetryScreen({
  message,
  description,
  onRetry,
}: {
  message: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-body-16-medium text-gray-900">{message}</p>
      {description && (
        <p className="text-body-14-regular text-gray-300">{description}</p>
      )}
      <Cta onClick={onRetry}>다시 시도</Cta>
    </div>
  );
}

const LOAD_FAILED = "문항을 불러오지 못했어요. 다시 시도해주세요.";

export default function SelfSurveyPage() {
  const {
    data,
    isLoading,
    isStartError,
    startErrorMessage,
    isSubmitting,
    submitError,
    retryStart,
    clearSubmitError,
    complete,
    goBack,
    trackQuestionView,
  } = useSelfSurvey();

  usePreloadImages(PRELOAD_SHARE_ILLUST);

  // 디자인상 로딩 화면 없음 → 문항을 받기 전엔 아무것도 렌더 안 함
  if (isLoading) return null;

  if (isStartError && !data) {
    return <RetryScreen message={startErrorMessage} onRetry={retryStart} />;
  }

  // 성공했으나 questions 가 비어 설문을 진행할 수 없는 경우
  if (!data || data.questions.length === 0) {
    return <RetryScreen message={LOAD_FAILED} onRetry={retryStart} />;
  }

  // 제출 중엔 아무것도 렌더 안 함 (성공 시 결과로 이동)
  if (isSubmitting) return null;

  if (submitError) {
    return (
      <RetryScreen
        message={submitError}
        description="답변을 제출하지 못했어요."
        onRetry={clearSubmitError}
      />
    );
  }

  return (
    <SurveyRunner
      questions={data.questions}
      subjectLabel="나에 대해"
      onComplete={complete}
      onBack={goBack}
      onQuestionView={trackQuestionView}
    />
  );
}
