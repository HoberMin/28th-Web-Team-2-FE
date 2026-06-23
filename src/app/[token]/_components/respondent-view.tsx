"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CenteredScreen } from "@/components/layout/centered-screen";
import { SurveyRunner } from "@/components/survey/survey-runner";
import { Cta } from "@/components/ui/cta";
import { Logo } from "@/components/ui/logo";
import { pickQuestions } from "@data/questions";

// 참여자 플로우 (product-spec #5 · Figma F06 intro node 414:13450) — GUI 1차 전경 정합.
// intro(자동 전환 splash) → 설문(8) → 완료 + "나도 만들기"(바이럴 루프). 신원·로그인 없음.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
type Step = "intro" | "survey" | "done";

export function RespondentView({ nickname }: { nickname: string }) {
  const [step, setStep] = useState<Step>("intro");

  // Figma 주석: intro 화면 2초 지속 후 설문으로 자동 전환(버튼 없음).
  useEffect(() => {
    if (step !== "intro") return;
    const t = window.setTimeout(() => setStep("survey"), 2000);
    return () => window.clearTimeout(t);
  }, [step]);

  if (step === "intro") {
    return (
      <CenteredScreen
        // figma-loose: F06 진입 하단 안내문 = Figma 블록 414:13468 pb-32. 기본 pb-6(24) → pb-8(32) override.
        className="pb-8"
        footer={
          // Figma: body/16-medium gray-700, 하단 고정
          <p className="text-body-16-medium text-gray-700">
            친구들의 답변이 모이면,
            <br />
            {nickname}님의 네컷이 완성돼요
          </p>
        }
      >
        {/* 콘텐츠 오토레이아웃 (Figma node 589:3870 + img) — 로고+타이틀 그룹 ↔ GIF box gap 56(gap-14) */}
        <div className="flex w-full flex-col items-center gap-14">
          {/* 로고 ↔ 타이틀 gap 48(gap-12) */}
          <div className="flex flex-col items-center gap-12">
            <Logo />
            <h1 className="text-head1-26 font-display1 text-gray-900">
              <span className="text-blue-500">{nickname}</span>님은
              <br />
              어떤 사람인가요?
            </h1>
          </div>

          {/* 카운트다운 GIF = 디자이너 프레임 대기. Figma도 흰 박스(350×332)로 자리만. */}
          <div className="flex aspect-[350/332] w-full flex-col items-center justify-center gap-1 rounded-2xl bg-white text-center">
            <span className="text-body-18-semibold text-gray-200">[GIF]</span>
            <span className="text-body-18-semibold text-gray-200">
              3, 2, 1 카운터하는 캐릭터 삽입 예정
            </span>
            <span className="text-body-18-semibold text-gray-200">
              *대략적인 위치만 참고해 주세요
            </span>
          </div>
        </div>
      </CenteredScreen>
    );
  }

  if (step === "survey") {
    // 참여자 설문: 첫 문항 뒤로(onBack) 없음 — 자동 전환 splash로 되돌아갈 필요 없음.
    // subjectName=닉네임 → 지문 `{name}` 가 게시자 이름으로 치환 (product-spec #5).
    return (
      <SurveyRunner
        questions={pickQuestions(8)}
        subjectName={nickname}
        onComplete={() => setStep("done")}
      />
    );
  }

  // done — Figma F06 완료 화면 노드 414:13540 정합.
  return (
    <CenteredScreen
      footer={
        // 하단 블록 — 안내문 ↔ CTA gap 12(gap-3)
        <div className="flex w-full flex-col gap-3">
          {/* Figma: body/14-medium gray-800 중앙 */}
          <p className="text-body-14-medium text-gray-800">
            남이 본 내 모습이 궁금하다면?
          </p>
          {/* Figma 주석: "클릭 시 F01_온보딩 이동" → href="/" (랜딩, product-spec #5 바이럴 루프) */}
          <Cta asChild>
            <Link href="/">나도 만들기</Link>
          </Cta>
        </div>
      }
    >
      {/* 콘텐츠 오토레이아웃 (Figma node 589:3869 + img) — 로고+타이틀 그룹 ↔ 일러스트 gap 40(gap-10) */}
      <div className="flex w-full flex-col items-center gap-10">
        {/* 로고 ↔ 타이틀블록 gap 40(gap-10) */}
        <div className="flex flex-col items-center gap-10">
          <Logo />
          {/* 타이틀 블록 — 제목 ↔ 서브 gap 12(gap-3) */}
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-head1-24 font-display1 text-gray-900">
              <span className="text-blue-500">{nickname}</span>님에게
              <br />
              답변을 전했어요!
            </h1>
            <p className="text-body-16-medium text-gray-300">
              방금 답변이 {nickname}님의
              <br />
              네컷을 완성하는 데 보탬이 됐어요
            </p>
          </div>
        </div>

        {/* 일러스트 placeholder — Figma top 344, w350 h332, 흰 박스. 실제 일러스트는 디자이너 프레임 대기. */}
        <div className="flex aspect-[350/332] w-full flex-col items-center justify-center gap-1 rounded-2xl bg-white text-center">
          <span className="text-body-18-semibold text-gray-200">
            일러스트 이미지 삽입 예정
          </span>
          <span className="text-body-18-semibold text-gray-200">
            *대략적인 위치만 참고해 주세요
          </span>
        </div>
      </div>
    </CenteredScreen>
  );
}
