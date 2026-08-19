"use client";

import { BtnSurvey } from "@/components/ui/btn-survey";
import { ArrowLeftIcon } from "@/components/ui/icons/arrow-left";
import { ProgressBar } from "@/components/ui/progress-bar";

import { useSurveyRunner } from "./use-survey-runner";
import type { AnswerEntry, SurveyQuestion } from "@/apis/survey/types";

interface SurveyRunnerProps {
  questions: SurveyQuestion[];
  /** 상단 서브젝트 라벨. figma-loose: GUI 1차 설문 화면엔 미표시 → 현재 미렌더(prop은 유지). */
  subjectLabel?: string;
  /** 마지막 문항 완료 시. answers = questionId → 선택된 answerOptionId */
  onComplete: (answers: AnswerEntry[]) => void;
  /** 첫 문항에서 뒤로 (없으면 ← 숨김) */
  onBack?: () => void;
  /** 문항이 화면에 표시될 때마다(문항 이동 포함) 호출 — 이탈 구간 트래킹용 */
  onQuestionView?: (questionIndex: number, total: number) => void;
}

// 본인·참여자 공용 설문 진행기 (product-spec #3·#5 · Figma F03 node 414:13343).
// 한 화면 한 문항. 헤더(뒤로) → 전체폭 진행바 → n/8 + 지문 → 보기(btn_survey).
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
export function SurveyRunner({
  questions,
  onComplete,
  onBack,
  onQuestionView,
}: SurveyRunnerProps) {
  const {
    index,
    total,
    question,
    selectedOptionId,
    isPending,
    select,
    goBack,
    canGoBack,
  } = useSurveyRunner({ questions, onComplete, onBack, onQuestionView });

  // 빈 문항 가드 — 공용 컴포넌트라 호출처가 늘어도 크래시 방지 (3종 상태: 빈).
  if (total === 0) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gray-50 px-6 text-center">
        <p className="text-body-14-regular text-gray-300">
          불러올 문항이 없어요
        </p>
      </div>
    );
  }

  const progress = Math.round(((index + 1) / total) * 100);

  // Figma: 화면 배경 gray-50, 헤더/진행바 전체폭, 지문·보기만 px-5(left-20)
  return (
    <div className="flex min-h-full flex-col bg-gray-50 pb-8">
      {/* 헤더 — Figma top44 h60. 뒤로 48×48 터치영역(icn 24, left-8) */}
      <header className="flex h-15 items-center px-2">
        {canGoBack && (
          <button
            type="button"
            onClick={goBack}
            aria-label="이전 문항"
            className="flex size-12 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <ArrowLeftIcon className="text-gray-900" />
          </button>
        )}
      </header>

      {/* 진행바 — Figma top104, 전체폭, h-4(4px), 흰 트랙 */}
      <ProgressBar
        value={progress}
        className="h-1 rounded-none bg-white"
        aria-label={`설문 진행 ${index + 1} / ${total}`}
      />

      {/* 진행 표시 + 지문 — Figma top144 */}
      {/* Figma: 진행바 하단 → 지문 블록 gap 36px → mt-9 일치, 지문↔보기 안 gap-2(8px) 일치 */}
      <div className="mt-9 flex flex-col items-center gap-2 px-5 text-center">
        <p className="text-body-16-medium">
          <span className="text-blue-500">{index + 1}</span>
          <span className="text-gray-300"> / {total}</span>
        </p>
        {/* Figma: head-point1/24 = display1(Y Spotlight) 24px (기존 head1-20에서 교정) */}
        {/* 질문 최대 3줄(line-clamp-3) + 단어 단위 줄바꿈(break-keep: 한 단어가 잘리지 않게) */}
        {/* btn_survey y 고정(디자이너 #2): 제목을 항상 3줄 높이(min-h-[3lh], lh=1.45)로 예약 →
            제목이 1~3줄로 바뀌어도 아래 보기 버튼 묶음의 시작 y가 변하지 않는다. */}
        <h1 className="line-clamp-3 min-h-[3lh] break-keep text-head1-24 font-display1 text-gray-900">
          {question.content}
        </h1>
      </div>

      {/* 보기 — Figma top329, btn_survey 간 gap 16(gap-4) */}
      {/* Figma: 지문 블록 → 보기 gap 48px → mt-12 일치 */}
      <ul className={`mt-12 flex flex-col gap-4 px-5${isPending ? " pointer-events-none" : ""}`}>
        {question.options.map((option) => {
          const isActive = selectedOptionId === option.answerOptionId;
          return (
            <li key={option.answerOptionId}>
              <BtnSurvey
                isActive={isActive}
                onClick={() => select(option.answerOptionId)}
              >
                {option.content}
              </BtnSurvey>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
