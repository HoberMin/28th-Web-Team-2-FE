"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useGetSurveyResultAPI } from "@/apis/survey/queries";
import { CenteredScreen } from "@/components/layout/centered-screen";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { DownloadIcon } from "@/components/ui/icons/download";
import { StarIcon } from "@/components/ui/icons/star";
import { Logo } from "@/components/ui/logo";
import { shareKakao } from "@/lib/share";
import {
  QUADRANTS,
  QUADRANT_LABEL,
  QUADRANT_SHORT_LABEL,
} from "@data/quadrants";

// 결과 뷰 (product-spec #6 · Figma F05 node 414:13631 본문 / 게이트는 별도 노드).
// 백엔드(2026-06-26 갱신): 종합(overallKeyword·overallAnalysis·actionTip) + 칸별 rich
//   (definitionKeyword·adjectiveKeywords·interpretation·imageUrl) 제공.
// 게이트(!entered): 로고+안내+캐릭터 → 본문(entered): 4cuts 합성카드 + 종합분석 + 칸별 상세×4 + Tip + 공유바.
// 상태 3종: 로딩(이미지 생성 대기 — 가장 중요) / 에러(재시도) / ready.
// 빈 칸(imageUrl=null): 고정 placeholder + "아직 다 발견하지 못했어" 문구.
// 톤: 백엔드 텍스트 그대로 표시(domain.md §1 긍정/중립 원칙은 서버 책임).
// TODO(✍️): 종합분석 카드의 굵은 헤드라인 — Figma엔 있으나 API 필드 없음. 백엔드 필드 생기면 추가(현재 본문만 렌더).
interface ResultViewProps {
  surveyCode: string;
  nickname: string;
  respondentCount: number;
  /** 4cuts 합성카드 날짜 표기용(결과 오픈 시각, status.resultAvailableAt) */
  resultAvailableAt: string;
}

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
  const [entered, setEntered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

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

  // ── 게이트 화면 (!entered) — Figma 노드 414:13565 / 589:4060 ────────────────
  if (!entered) {
    return (
      <CenteredScreen
        footer={<Cta onClick={() => setEntered(true)}>내 네컷 결과 보기</Cta>}
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

  // ── 결과 본문 (entered) — Figma F05 ─────────────────────────────────────────
  const resultDate = formatResultDate(resultAvailableAt);

  return (
    // figma-loose: 공유바 fixed 높이(pb-6+h-14+pt-3 ≈ 88px) → pb-28(112px)으로 여유 확보.
    <main className="relative flex min-h-full flex-col bg-white pb-28">

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

      {/* ── 본문 섹션들 (Figma gap 72) ──────────────────────────────────── */}
      <div className="flex flex-col gap-[72px] px-5 pt-4">

        {/* ── 4cuts 합성 카드 + 디스클레이머 (Figma 627:4706, gap 8) ──────── */}
        <section className="flex flex-col gap-2">
          {/* 다크 카드: 2×2 네컷 + 날짜/캡션 (Figma 414:13632) */}
          <div className="overflow-hidden rounded-[18px] bg-gray-900 px-[14px] pb-5 pt-[21px]">
            <div className="grid grid-cols-2 gap-2.5">
              {QUADRANTS.map(({ key }) => {
                const imageUrl = data?.quadrants?.[key]?.imageUrl ?? null;
                const label = QUADRANT_LABEL[key];
                return (
                  <div
                    key={key}
                    className="relative aspect-[160/218] overflow-hidden rounded-lg border border-white/15 bg-white"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${label} — AI 생성 이미지`}
                        fill
                        // CDN 호스트 가변/미확정 → 최적화 비활성(remotePatterns 의존 제거)
                        unoptimized
                        className="object-cover"
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
                  </div>
                );
              })}
            </div>
            {/* 캡션: 날짜 + 종합 키워드 (Figma 414:13633) */}
            <div className="mt-[14px] flex flex-col items-center text-center">
              {resultDate && (
                <p className="text-body-14-regular text-gray-400">{resultDate}</p>
              )}
              {/* figma-loose: Figma는 "마음을 잘 여는 송이"(닉네임형)지만 API는 overallKeyword 단일 → 그대로 표기 */}
              {data?.overallKeyword && (
                <p className="font-display1 text-head1-20 text-white">
                  {data.overallKeyword}
                </p>
              )}
            </div>
          </div>

          {/* 디스클레이머 (Figma 414:13653) */}
          <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-center">
            <p className="text-body-14-medium text-gray-300">
              친구들의 답변을 바탕으로 AI가 그린 이미지예요.
              <br />
              실제와 다를 수 있어요.
            </p>
          </div>
        </section>

        {/* ── 종합 분석 (Figma 414:13655, gap 16) ───────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col">
            <p className="text-body-18-medium text-gray-900">{nickname}님은</p>
            {data?.overallKeyword && (
              <p className="font-display1 text-head1-20 text-gray-900">
                {data.overallKeyword}
              </p>
            )}
          </div>
          {data?.overallAnalysis && (
            <div className="flex flex-col gap-2 rounded-[14px] bg-gray-50 p-3">
              <div className="flex items-center gap-1">
                <StarIcon className="size-5" />
                <span className="text-body-14-regular text-gray-400">종합 분석</span>
              </div>
              {data.overallAnalysisTitle && (
                <p className="text-body-16-semibold text-gray-900">
                  {data.overallAnalysisTitle}
                </p>
              )}
              <p className="text-body-16-regular text-gray-700">
                {data.overallAnalysis}
              </p>
            </div>
          )}
        </section>

        {/* ── 칸별 상세 result_detail (Figma 414:13676, gap 64) ──────────── */}
        <section className="flex flex-col gap-16">
          {QUADRANTS.map(({ key }) => {
            const quadrantData = data?.quadrants?.[key];
            const imageUrl = quadrantData?.imageUrl ?? null;
            const interpretation = quadrantData?.interpretation ?? null;
            const definitionKeyword = quadrantData?.definitionKeyword ?? null;
            const adjectives = quadrantData?.adjectiveKeywords ?? [];
            const shortLabel = QUADRANT_SHORT_LABEL[key];
            const label = QUADRANT_LABEL[key];

            return (
              <article key={key} className="flex flex-col gap-5">
                {/* name 행 (Figma 414:13678, gap 10) */}
                <div className="flex items-center gap-2.5">
                  <span className="rounded bg-gray-50 px-2 py-0.5 text-body-14-medium text-gray-300">
                    {shortLabel}
                  </span>
                  <span className="text-body-18-semibold text-gray-900">
                    {definitionKeyword ? `${definitionKeyword} ${nickname}` : nickname}
                  </span>
                </div>

                {/* img + contents (Figma 414:13682, gap 12) */}
                <div className="flex flex-col gap-3">
                  {/* 이미지 (Figma h124, object-cover 크롭) */}
                  <div className="relative h-[124px] w-full overflow-hidden rounded-lg border border-gray-50 bg-gray-50">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${label} — AI 생성 이미지`}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 350px"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-1 text-center">
                        <span className="text-body-16-medium text-gray-200" aria-hidden>
                          🌫️
                        </span>
                        <p className="text-caption-12-medium text-gray-300">
                          아직 다 발견하지 못했어
                        </p>
                      </div>
                    )}
                  </div>

                  {/* contents (Figma 414:13685, gap 10) */}
                  <div className="flex flex-col gap-2.5">
                    {adjectives.length > 0 && (
                      <div className="flex flex-wrap gap-[7px]">
                        {adjectives.map((adj, i) => (
                          <span
                            key={`${adj}-${i}`}
                            className="rounded-full bg-yellow-200 px-3 py-0.5 text-body-14-medium text-yellow-800"
                          >
                            {adj}
                          </span>
                        ))}
                      </div>
                    )}
                    {interpretation ? (
                      <p className="text-body-16-regular text-gray-700">
                        {interpretation}
                      </p>
                    ) : (
                      <p className="text-body-16-regular text-gray-300">
                        더 많은 친구들에게 물어봐요
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* ── Tip 카드 (Figma 414:13668) ─────────────────────────────────── */}
        {data?.actionTip && (
          <div className="flex flex-col gap-2 rounded-[14px] bg-gray-50 p-3">
            <div className="flex items-center gap-1">
              <StarIcon className="size-5" />
              <span className="text-body-16-semibold text-gray-900">
                Tip! 이렇게 해보는 거 어때요?
              </span>
            </div>
            <p className="text-body-16-regular text-gray-700">{data.actionTip}</p>
          </div>
        )}
      </div>

      {/* ── 하단 고정 공유바 "btm_CTA_area" (Figma bottom0 fixed) ────────── */}
      <div className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[390px] gap-1 border-t border-gray-50 bg-white px-5 pb-6 pt-3 shadow-bar md:absolute">
        <CtaSmall variant="stroke_icn" onClick={handleCopy} className="flex-1 border-gray-100">
          링크 복사하기
        </CtaSmall>
        <CtaSmall variant="fill" onClick={handleKakao} className="flex-1">
          카카오톡 공유하기
        </CtaSmall>
      </div>

      {/* 토스트 — F04·Figma 627:9624 규격 통일(bg gray-900/70·px-7·py-2·body-14-medium) */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-6 mx-auto w-fit max-w-[90%] rounded-full bg-gray-900/70 px-7 py-2 text-center text-body-14-medium text-white md:absolute"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
