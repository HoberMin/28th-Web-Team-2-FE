"use client";

import { useEffect, useRef, useState } from "react";

import type { AnswerEntry, SurveyQuestion } from "@/apis/survey/types";

// 설문 진행 상태머신 — 본인 설문·참여자 설문이 공유한다.
// 문항 전환·선택 디바운스·history 되감기를 여기서 전담하고, 뷰는 그리기만 한다.

/** 보기를 고른 뒤 다음 문항으로 넘어가기까지의 선택 피드백 시간 */
const ADVANCE_MS = 500;

interface UseSurveyRunnerArgs {
  questions: SurveyQuestion[];
  onComplete: (answers: AnswerEntry[]) => void;
  onBack?: () => void;
  onQuestionView?: (index: number, total: number) => void;
}

export function useSurveyRunner({
  questions,
  onComplete,
  onBack,
  onQuestionView,
}: UseSurveyRunnerArgs) {
  const [index, setIndex] = useState(0);
  /** questionId → 선택된 answerOptionId */
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [isPending, setIsPending] = useState(false);

  const timer = useRef<number | null>(null);
  const completingRef = useRef(false);

  const total = questions.length;

  // ref 로 최신 콜백을 들고 있어 index 변화에만 반응(콜백 재생성마다 재발화 방지)
  const onQuestionViewRef = useRef(onQuestionView);
  useEffect(() => {
    onQuestionViewRef.current = onQuestionView;
  });

  useEffect(() => {
    if (total === 0) return;
    onQuestionViewRef.current?.(index, total);
  }, [index, total]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  // ── 브라우저/시스템 back → 전 문항 (popstate 가로채기) ──────────────────────
  // 8문항이 한 페이지 안 index state 라 history 엔 문항 기록이 없다 → 그냥 두면 back 한 번에
  // 설문을 통째로 이탈(닉네임으로). 모바일 주 타겟이라 사용자는 이 back 을 가장 많이 누른다.
  //
  // 방식(per-step): 문항을 넘길 때마다 가짜 history entry 를 1개씩 쌓는다(forward = pushState).
  // back 을 누르면 그 entry 가 pop 되며 popstate → index 만 1 감소(앞 문항). 첫 문항(index 0)에선
  // 쌓아둔 entry 가 없으므로 back 이 설문 진입 직전(닉네임)으로 자연히 빠져나간다.
  useEffect(() => {
    const onPop = () => {
      if (completingRef.current) return; // 완료 후 결과로 전환 중이면 무시
      // index 0 이면 같은 값을 돌려줘 아무 일도 일어나지 않는다(React 가 bail out)
      // → 브라우저가 이미 설문 밖으로 pop 한 상태라 그대로 나가게 둔다.
      setIndex((i) => (i > 0 ? i - 1 : i));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /** Record<questionId, answerOptionId> → API 가 받는 배열 */
  const toAnswers = (picked: Record<number, number>): AnswerEntry[] =>
    Object.entries(picked).map(([qId, optId]) => ({
      questionId: Number(qId),
      answerOptionId: optId,
    }));

  /**
   * 문항마다 쌓은 step entry(개수 === index)를 되감은 뒤 완료를 알린다.
   * 이렇게 해야 결과가 닉네임 바로 위에 와서, 결과/공유 페이지에서 back 이
   * 잔여 설문 entry 로 튕기지 않는다(공유 "나가기"도 정상 동작).
   */
  const finish = (answers: AnswerEntry[]) => {
    completingRef.current = true; // 되감는 동안의 popstate 는 무시
    if (index === 0) {
      onComplete(answers);
      return;
    }
    const onUnwound = () => {
      window.removeEventListener("popstate", onUnwound);
      onComplete(answers);
    };
    window.addEventListener("popstate", onUnwound);
    window.history.go(-index);
  };

  const select = (answerOptionId: number) => {
    if (isPending) return;
    const question = questions[index];
    const next = { ...selected, [question.questionId]: answerOptionId };
    setSelected(next);
    setIsPending(true);

    timer.current = window.setTimeout(() => {
      setIsPending(false);
      if (index + 1 < total) {
        // 문항을 넘길 때마다 history entry 1개 push → back 이 이 entry 를 pop 해 앞 문항으로
        window.history.pushState({ lookySurveyStep: index + 1 }, "");
        setIndex(index + 1);
      } else {
        finish(toAnswers(next));
      }
    }, ADVANCE_MS);
  };

  /** 헤더 뒤로 — 첫 문항이면 호출자에게 넘기고, 아니면 브라우저 back 과 같은 경로를 탄다 */
  const goBack = () => {
    if (index === 0) {
      onBack?.();
      return;
    }
    window.history.back();
  };

  return {
    index,
    total,
    question: questions[index],
    selectedOptionId: questions[index]
      ? selected[questions[index].questionId]
      : undefined,
    isPending,
    select,
    goBack,
    /** 뒤로 버튼을 보여줄지 — 첫 문항에선 onBack 이 있을 때만 */
    canGoBack: index > 0 || Boolean(onBack),
  };
}
