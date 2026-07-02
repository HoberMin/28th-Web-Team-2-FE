"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { CenteredScreen } from "@/components/layout/centered-screen";
import { Cta } from "@/components/ui/cta";
import { cn } from "@/lib/utils";
import type { GenerationPhase } from "@/apis/survey/types";

// F05_결과물 생성_AI생성중 로딩 A/B (node 1318-9934 / 1318-9959).
// 체크리스트 3단계 ↔ 백엔드 4단계(generationPhase) 매핑(합의 전 근사):
//   QUEUED → 0단계 진행중 / NARRATIVE_GENERATING → 1단계 진행중 / IMAGE_GENERATING·RETRYING → 2단계 진행중
const STEP_INDEX: Record<GenerationPhase, number> = {
  QUEUED: 0,
  NARRATIVE_GENERATING: 1,
  IMAGE_GENERATING: 2,
  RETRYING: 2,
};

interface GeneratingViewProps {
  nickname: string;
  generationPhase: GenerationPhase | null;
  onRestart: () => void;
}

export function GeneratingView({
  nickname,
  generationPhase,
  onRestart,
}: GeneratingViewProps) {
  const [showA, setShowA] = useState(true);

  useEffect(() => {
    const toggle = window.setInterval(() => setShowA((prev) => !prev), 1000);
    return () => window.clearInterval(toggle);
  }, []);

  const activeStep = generationPhase ? STEP_INDEX[generationPhase] : 0;
  const steps = [
    "친구들의 답변 종합 중",
    `${nickname}님의 설명 작성 중`,
    `${nickname}님의 네컷 그리는 중`,
  ];

  return (
    <CenteredScreen
      background="green"
      footer={<Cta onClick={onRestart}>처음으로 돌아가기</Cta>}
    >
      <div className="flex w-[350px] max-w-full flex-col items-center gap-13">
        <div className="flex w-full flex-col items-center gap-12">
          <h1 className="text-head1-26 font-display1 text-gray-900">
            <span className="text-green-300">{nickname}</span>님의 네컷을
            <br />
            만들고 있어요!
          </h1>

          <ul className="flex flex-col items-start gap-3">
            {steps.map((label, index) => (
              <li key={label} className="flex items-center gap-2">
                <StepIcon
                  state={
                    index < activeStep
                      ? "done"
                      : index === activeStep
                        ? "active"
                        : "waiting"
                  }
                />
                <span className="text-body-16-medium text-gray-800">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative w-[350px] max-w-full select-none">
          <Image
            src="/assets/img_character_hamster_desk_writing.png"
            alt=""
            aria-hidden
            width={350}
            height={300}
            priority
            className={cn("w-full", showA ? "opacity-100" : "opacity-0")}
          />
          <Image
            src="/assets/img_character_hamster_desk_standing.png"
            alt=""
            aria-hidden
            width={350}
            height={300}
            priority
            className={cn(
              "absolute inset-0 w-full",
              showA ? "opacity-0" : "opacity-100",
            )}
          />
        </div>
      </div>
    </CenteredScreen>
  );
}

function StepIcon({ state }: { state: "done" | "active" | "waiting" }) {
  if (state === "done") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-700">
        <Check className="size-3.5 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-gray-100 border-t-green-300" />
    );
  }
  return (
    <span className="size-5 shrink-0 rounded-full border-2 border-gray-200" />
  );
}
