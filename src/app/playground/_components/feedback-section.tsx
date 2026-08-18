"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Cta } from "@/components/ui/cta";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tooltip } from "@/components/ui/tooltip";

import { Section, SpecNote, SpecRow } from "./spec";

// 진행·안내·확인 계열. 상태를 눌러 확인할 수 있게 실제로 동작시킨다.

const SURVEY_TOTAL = 8;

export function FeedbackSection() {
  const [step, setStep] = useState(3);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Section
      id="feedback"
      title="진행 · 안내"
      description="설문 진행률, 말풍선, 이탈 확인 다이얼로그."
    >
      <SpecRow
        name="ProgressBar"
        usage={`설문 진행률. 범위 밖 값은 clamp. 현재 ${step}/${SURVEY_TOTAL}`}
      >
        <ProgressBar
          value={(step / SURVEY_TOTAL) * 100}
          aria-label={`설문 진행률 ${step} / ${SURVEY_TOTAL}`}
        />
        <div className="flex gap-2">
          <Cta
            className="h-10 text-head1-16"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            이전
          </Cta>
          <Cta
            className="h-10 text-head1-16"
            onClick={() => setStep((s) => Math.min(SURVEY_TOTAL, s + 1))}
          >
            다음
          </Cta>
        </div>
      </SpecRow>

      <SpecRow name="ProgressBar · 경계값" usage="0% / 100%">
        <ProgressBar value={0} aria-label="진행률 0%" />
        <ProgressBar value={100} aria-label="진행률 100%" />
      </SpecRow>

      {/* 꼬리가 아래로 뻗어 나오므로 아래쪽 여백을 준다 */}
      <SpecRow
        name="Tooltip"
        usage="꼬리 정렬 3종 — 기준이 되는 요소 위에 얹어 쓴다"
      >
        <div className="flex flex-col gap-6 pb-3">
          <Tooltip tailAlign="left">왼쪽 정렬 꼬리</Tooltip>
          <Tooltip tailAlign="center">가운데 정렬 꼬리</Tooltip>
          <Tooltip tailAlign="right">오른쪽 정렬 꼬리</Tooltip>
        </div>
      </SpecRow>

      <SpecRow
        name="ConfirmDialog"
        usage="설문 도중 이탈 등 되돌릴 수 없는 행동 앞에서"
      >
        <Cta onClick={() => setDialogOpen(true)}>다이얼로그 열기</Cta>
        <ConfirmDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="정말 나갈까요?"
          description="지금 나가면 지금까지 고른 답이 사라져요."
          cancelLabel="계속하기"
          confirmLabel="나가기"
          onConfirm={() => setDialogOpen(false)}
        />
      </SpecRow>

      <SpecNote>
        ProgressBar 는 <code>aria-label</code> 을 반드시 넘겨주세요 — 진행률
        수치만으로는 무엇의 진행인지 보조기술이 알 수 없습니다.
      </SpecNote>
    </Section>
  );
}
