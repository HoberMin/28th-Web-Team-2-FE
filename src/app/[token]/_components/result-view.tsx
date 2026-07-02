"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useGetSurveyResultAPI } from "@/apis/survey/queries";
import { CenteredScreen } from "@/components/layout/centered-screen";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { DownloadIcon } from "@/components/ui/icons/download";
import { Logo } from "@/components/ui/logo";
import { shareKakao } from "@/lib/share";
import {
  QUADRANTS,
  QUADRANT_FRONT_LABEL,
  QUADRANT_LABEL,
} from "@data/quadrants";
import type { QuadrantKey } from "@data/quadrants";

import { ResultCardModal } from "./result-card-modal";
import { ResultLoading } from "./result-loading";
import { ResultTapHint } from "./result-tap-hint";

// 결과 뷰 (product-spec #6 · Figma F05 컴팩트 개편 — 인터랙션 3종 스펙 2026-07-02).
// phase 상태머신: gate(!entered) → loading(5초 고정 연출, 결과는 항상 READY) → body(컴팩트).
// body: 헤더 + 4cuts 다크카드(각 칸 button) + 디스클레이머 + 하단 공유바.
//   진입 1초 후 "눌러봐" 힌트 오버레이(1회성) → 4cuts 칸 탭 시 ResultCardModal(중앙 확대→뒤집힘→뒷면).
// 종합분석·칸별상세×4·Tip 인라인 섹션은 컴팩트 개편으로 제거 — 내용은 카드 뒷면 모달로 이동(스펙 §2).
// 상태 3종: 로딩(이미지 생성 대기 — 가장 중요) / 에러(재시도) / ready.
// 빈 칸(imageUrl=null): 그리드는 안개 placeholder, 모달 뒷면은 재참여 메시지 + 공유 CTA(domain.md 빈칸 정책).
// 톤: 백엔드 텍스트 그대로 표시(domain.md §1 긍정/중립 원칙은 서버 책임).
interface ResultViewProps {
  surveyCode: string;
  nickname: string;
  respondentCount: number;
  /** 4cuts 합성카드 날짜 표기용(결과 오픈 시각, status.resultAvailableAt) */
  resultAvailableAt: string;
}

type ResultPhase = "gate" | "loading" | "body";

// ISO 문자열 → "YYYY. MM. DD" (Figma 4cuts 캡션 날짜)
function formatResultDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${day}`;
}

export function ResultView({
  surveyCode,
  nickname,
  respondentCount,
  resultAvailableAt,
}: ResultViewProps) {
  const [phase, setPhase] = useState<ResultPhase>("gate");
  const [toast, setToast] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<QuadrantKey | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const timer = useRef<number | null>(null);
  // 힌트 정렬 기준 — 실제 첫 그리드 카드(모두가 아는 나)
  const firstCardRef = useRef<HTMLButtonElement | null>(null);

  // ── hooks (early return 앞) ───────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useGetSurveyResultAPI(surveyCode, {
    // 결과가 아직 READY가 아니면(quadrants=null) 생성 중 — 준비될 때까지 폴링, 준비되면 중단
    refetchInterval: (query) => (query.state.data?.quadrants ? false : 3000),
  });

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  // body 진입 1초 후 힌트 노출(1회성)
  useEffect(() => {
    if (phase !== "body" || hintShown) return;
    const hintTimer = window.setTimeout(() => {
      setHintVisible(true);
      setHintShown(true);
    }, 1000);
    return () => window.clearTimeout(hintTimer);
  }, [phase, hintShown]);

  // ── 로딩 — 이미지 생성 대기 (가장 중요 — product-spec #6) ──────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
        <p className="text-body-16-medium text-gray-900">결과를 불러오고 있어요</p>
        <p className="text-body-14-regular text-gray-300">잠시만 기다려주세요</p>
      </div>
    );
  }

  // ── 에러 ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-body-16-medium text-gray-900">
          결과를 불러오지 못했어요
        </p>
        <p className="text-body-14-regular text-gray-300">{error.message}</p>
        <Cta onClick={() => void refetch()}>다시 시도</Cta>
      </div>
    );
  }

  // ── 생성 대기 — 데이터는 받았지만 아직 READY 아님(quadrants=null). 폴링 중 ──
  if (data && !data.quadrants) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
        <p className="text-body-16-medium text-gray-900">
          네컷을 만들고 있어요
        </p>
        <p className="text-body-14-regular text-gray-300">
          잠시만 기다리면 결과가 나와요
        </p>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToast(msg);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const currentUrl = () =>
    typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      showToast("링크가 복사됐어요!");
    } catch {
      showToast("복사에 실패했어요. 링크를 길게 눌러 복사해주세요");
    }
  };

  const handleKakao = async () => {
    const result = await shareKakao({
      link: currentUrl(),
      title: `${nickname}님의 인생네컷이 나왔어요!`,
      description: "친구들이 본 나를 인생네컷으로. looky",
      imageUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}/assets/og-image.png`
          : "/assets/og-image.png",
    });
    showToast(result === "shared" ? "카카오톡 공유를 열었어요" : "링크를 복사했어요");
  };

  // ── 게이트 화면 (phase === 'gate') — Figma 노드 414:13565 / 589:4060 ────────
  if (phase === "gate") {
    return (
      <CenteredScreen
        footer={<Cta onClick={() => setPhase("loading")}>내 네컷 결과 보기</Cta>}
      >
        {/* 콘텐츠 오토레이아웃 (Figma node 589:4060) — 로고+타이틀 그룹 ↔ 일러스트 gap 56(gap-14) */}
        <div className="flex w-full flex-col items-center gap-14">
          {/* 로고 ↔ 타이틀블록 gap 56(gap-14, 타이틀 top 176→188 이동 디자이너 교정) */}
          <div className="flex flex-col items-center gap-14">
            <Logo />
            {/* 타이틀 블록 — 제목 ↔ 서브 gap 12(gap-3) */}
            <div className="flex flex-col items-center gap-3">
              <h1 className="text-head1-24 font-display1 text-gray-900">
                <span className="text-blue-500">{nickname}</span>님의 네컷이
                <br />
                완성됐어요
              </h1>
              <p className="text-body-16-medium text-gray-300">
                친구 {respondentCount}명의 응답을 보러 갈까요?
              </p>
            </div>
          </div>

          {/* 일러스트 — Figma img_character_hamster_insight_noword(270×334, 중앙). 에셋 4x 1085×1336. 장식이라 alt="". */}
          <Image
            src="/assets/img_character_hamster_insight_noword.png"
            alt=""
            aria-hidden
            width={270}
            height={334}
            priority
            className="w-[270px] max-w-full select-none"
          />
        </div>
      </CenteredScreen>
    );
  }

  // ── 로딩 연출 (phase === 'loading') — 순수 5초 고정, Figma 1254-7607/1254-7618 ──
  if (phase === "loading") {
    return <ResultLoading onDone={() => setPhase("body")} />;
  }

  // ── 결과 본문 (phase === 'body') — Figma F05 컴팩트 ──────────────────────────
  const resultDate = formatResultDate(resultAvailableAt);
  const selectedData = selectedKey ? data?.quadrants?.[selectedKey] : null;
  const firstQuadrant = QUADRANTS[0];
  const firstImageUrl = data?.quadrants?.[firstQuadrant.key]?.imageUrl ?? null;

  return (
    <main className="relative flex min-h-full flex-col bg-white pb-[116px]">

      {/* ── 헤더 (Figma top 44, h60) ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4">
        <Logo size="sm" />
        {/* 다운받기 pill 버튼 — placeholder(기능 미구현, 디자이너 에셋 대기) */}
        <button
          type="button"
          aria-label="이미지 다운받기"
          className="flex items-center gap-0.5 rounded-full border border-gray-100 bg-white py-2 pl-3 pr-4"
        >
          <DownloadIcon className="size-6 text-gray-900" />
          <span className="text-body-14-medium text-gray-900">다운받기</span>
        </button>
      </div>

      {/* ── 4cuts 합성 카드 + 디스클레이머 (Figma 627:4706, gap 8) ────────── */}
      <section className="flex flex-col gap-2 px-5 pt-4">
        {/* 다크 카드: 2×2 네컷 + 날짜/캡션 (Figma 414:13632) */}
        <div className="overflow-hidden rounded-[18px] bg-gray-900 px-[14px] pb-5 pt-[21px]">
          <div className="grid grid-cols-2 gap-2.5">
            {QUADRANTS.map(({ key }, index) => {
              const imageUrl = data?.quadrants?.[key]?.imageUrl ?? null;
              const label = QUADRANT_LABEL[key];
              return (
                <motion.button
                  key={key}
                  ref={index === 0 ? firstCardRef : undefined}
                  type="button"
                  layoutId={`f05-card-${key}`}
                  aria-label={`${label} 자세히 보기`}
                  onClick={() => setSelectedKey(key)}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ visibility: selectedKey === key ? "hidden" : "visible" }}
                  className="relative aspect-[160/218] overflow-hidden rounded-lg border border-white/15 bg-white"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${label} — AI 생성 이미지`}
                      fill
                      // CDN 호스트 가변/미확정 → 최적화 비활성(remotePatterns 의존 제거)
                      unoptimized
                      draggable={false}
                      className="pointer-events-none object-cover select-none [-webkit-touch-callout:none]"
                      sizes="(max-width: 768px) 45vw, 165px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gray-50">
                      <span className="text-body-16-medium text-gray-200" aria-hidden>
                        🌫️
                      </span>
                    </div>
                  )}
                  {/* 칸 라벨 오버레이 (Figma Overlay: bg black/50) */}
                  <span className="absolute bottom-[7px] left-[7px] rounded bg-black/50 px-1.5 py-[3px] text-caption-12-regular text-white">
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
          {/* 캡션: 날짜 + 종합 키워드 (Figma 414:13633) */}
          <div className="mt-[14px] flex flex-col items-center text-center">
            {resultDate && (
              <p className="text-body-14-regular text-gray-400">{resultDate}</p>
            )}
            {data?.overallKeyword && (
              <p className="font-display1 text-head1-20 text-white">
                {data.overallKeyword} {nickname}
              </p>
            )}
          </div>
        </div>

        {/* 디스클레이머 (Figma 1257:8038) */}
        <div className="rounded-lg bg-white px-3 py-2 text-center">
          <p className="text-body-14-medium text-gray-300">
            친구들의 답변을 바탕으로 AI가 그린 이미지예요.
            <br />
            실제와 다를 수 있어요.
          </p>
        </div>
      </section>

      {/* ── 하단 고정 공유바 "btm_CTA_area" (Figma bottom0 fixed, 힌트/모달 딤보다 항상 위 z) ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[390px] gap-1 border-t border-gray-50 bg-white px-5 pb-6 pt-3 md:absolute">
        <CtaSmall variant="stroke_icn" onClick={handleCopy} className="flex-1 border-gray-100">
          링크 복사하기
        </CtaSmall>
        <CtaSmall variant="fill" onClick={handleKakao} className="flex-1">
          카카오톡 공유하기
        </CtaSmall>
      </div>

      {/* ── "눌러봐" 힌트 오버레이 (진입 1초 후, 1회성) — Figma 1268-7019 ────── */}
      {hintVisible && (
        <ResultTapHint
          anchorRef={firstCardRef}
          firstCardImageUrl={firstImageUrl}
          firstCardLabel={QUADRANT_LABEL[firstQuadrant.key]}
          onDismiss={() => setHintVisible(false)}
        />
      )}

      {/* ── 카드 확대 모달 (탭 → 중앙 확대 → 뒤집힘 → 뒷면) — Figma 1257-8140 ── */}
      <AnimatePresence>
        {selectedKey && (
          <ResultCardModal
            key={selectedKey}
            quadrantKey={selectedKey}
            frontLabel={QUADRANT_FRONT_LABEL[selectedKey]}
            nickname={nickname}
            imageUrl={selectedData?.imageUrl ?? null}
            definitionKeyword={selectedData?.definitionKeyword ?? null}
            adjectiveKeywords={selectedData?.adjectiveKeywords ?? []}
            interpretation={selectedData?.interpretation ?? null}
            onClose={() => setSelectedKey(null)}
            onShareCopy={() => void handleCopy()}
            onShareKakao={() => void handleKakao()}
          />
        )}
      </AnimatePresence>

      {/* 토스트 — F04·Figma 627:9624 규격 통일(bg gray-900/70·px-7·py-2·body-14-medium) */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-gray-900/70 px-7 py-2 text-center text-body-14-medium text-white md:absolute"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
