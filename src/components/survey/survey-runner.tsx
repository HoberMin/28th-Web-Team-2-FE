"use client";

import { useEffect, useRef, useState } from "react";

import { BtnSurvey } from "@/components/ui/btn-survey";
import { ArrowLeftIcon } from "@/components/ui/icons/arrow-left";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { AnswerEntry, SurveyQuestion } from "@/apis/survey/types";

interface SurveyRunnerProps {
  questions: SurveyQuestion[];
  /** 상단 서브젝트 라벨. figma-loose: GUI 1차 설문 화면엔 미표시 → 현재 미렌더(prop은 유지). */
  subjectLabel?: string;
  /** 마지막 문항 완료 시. answers = questionId → 선택된 answerOptionId */
  onComplete: (answers: AnswerEntry[]) => void;
  /** 첫 문항에서 뒤로 (없으면 ← 숨김) */
  onBack?: () => void;
}

// 본인·참여자 공용 설문 진행기 (product-spec #3·#5 · Figma F03 node 414:13343).
// 한 화면 한 문항. 헤더(뒤로) → 전체폭 진행바 → n/8 + 지문 → 보기(btn_survey).
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
export function SurveyRunner({
  questions,
  onComplete,
  onBack,
}: SurveyRunnerProps) {
  const [index, setIndex] = useState(0);
  // questionId → 선택된 answerOptionId
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [isPending, setIsPending] = useState(false);
  const timer = useRef<number | null>(null);

  // ── 브라우저/시스템 back → 전 문항 (popstate 가로채기) ──────────────────────
  // 8문항이 한 페이지 안 index state라 history엔 문항 기록이 없다 → 그냥 두면 back 한 번에
  // 설문을 통째로 이탈(닉네임으로). 모바일 주 타겟이라 사용자는 이 back을 가장 많이 누른다.
  //
  // 방식(per-step): 문항을 넘길 때마다 가짜 history entry를 1개씩 쌓는다(forward = pushState).
  // back을 누르면 그 entry가 pop되며 popstate → index만 1 감소(앞 문항). 첫 문항(index 0)에선
  // 쌓아둔 entry가 없으므로 back이 설문 진입 직전(닉네임)으로 자연히 빠져나간다.
  // ※ 완료 시엔 결과로 replace → 결과에서 back 시 설문 재진입(재제출/409)은
  //    survey/page.tsx의 done-flag(isSelfSurveyDone)가 막는다.
  const completingRef = useRef(false);
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (completingRef.current) return; // 완료 후 결과로 전환 중이면 무시
      // 문항이 남았으면 앞 문항으로. index 0이면 아무것도 안 함 →
      // 브라우저가 이미 설문 밖(닉네임)으로 pop한 상태라 그대로 나가게 둔다.
      if (indexRef.current > 0) {
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const total = questions.length;
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

  const question = questions[index];

  const handleSelect = (answerOptionId: number) => {
    if (isPending) return;
    const next = { ...selected, [question.questionId]: answerOptionId };
    setSelected(next);
    setIsPending(true);
    timer.current = window.setTimeout(() => {
      setIsPending(false);
      if (index + 1 < total) {
        // 문항 넘길 때마다 history entry 1개 push → back이 이 entry를 pop해 앞 문항으로
        window.history.pushState({ lookySurveyStep: index + 1 }, "");
        setIndex(index + 1);
      } else {
        // Record<number, number> → {questionId, answerOptionId}[] 변환
        const answers = Object.entries(next).map(([qId, optId]) => ({
          questionId: Number(qId),
          answerOptionId: optId,
        }));
        completingRef.current = true; // 결과로의 replace 중 popstate 무시
        // 문항마다 쌓은 step entry(개수 === index)를 되감은 뒤 결과로 replace한다.
        // 이렇게 해야 결과가 닉네임 바로 위에 와서, 결과/공유 페이지에서 back이
        // 잔여 설문 entry로 튕기지 않는다(공유 "나가기"도 정상 동작).
        if (index > 0) {
          const onUnwound = () => {
            window.removeEventListener("popstate", onUnwound);
            onComplete(answers);
          };
          window.addEventListener("popstate", onUnwound);
          window.history.go(-index);
        } else {
          onComplete(answers);
        }
      }
    }, 500);
  };

  const handleBack = () => {
    if (index === 0) {
      onBack?.();
      return;
    }
    // 화면 ← 버튼도 브라우저 back과 같은 경로로 통일(push한 entry pop → popstate → index-1)
    // → history 싱크를 한 곳(popstate)에서만 관리.
    window.history.back();
  };

  const progress = Math.round(((index + 1) / total) * 100);

  // Figma: 화면 배경 gray-50, 헤더/진행바 전체폭, 지문·보기만 px-5(left-20)
  return (
    <div className="flex min-h-full flex-col bg-gray-50 pb-8">
      {/* 헤더 — Figma top44 h60. 뒤로 48×48 터치영역(icn 24, left-8) */}
      <header className="flex h-15 items-center px-2">
        {(onBack || index > 0) && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="이전 문항"
            className="flex size-12 items-center justify-center"
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
          const isActive = selected[question.questionId] === option.answerOptionId;
          return (
            <li key={option.answerOptionId}>
              <BtnSurvey
                isActive={isActive}
                onClick={() => handleSelect(option.answerOptionId)}
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
