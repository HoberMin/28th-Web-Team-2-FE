"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useGetSurveyResultAPI } from "@/apis/survey/queries";
import { CenteredScreen } from "@/components/layout/centered-screen";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { DownloadIcon } from "@/components/ui/icons/download";
import { Logo } from "@/components/ui/logo";
import { shareKakao } from "@/lib/share";
import { QUADRANTS, QUADRANT_LABEL } from "@data/quadrants";

// 결과 뷰 (product-spec #6 · Figma F05 노드 414:13565(게이트) / 414:13748(본문)) — 간소화.
// 백엔드: 칸별 imageUrl + interpretation 4칸만 제공. headline/형용사/summary/tip/합성네컷 제거.
// 게이트(!entered): 하늘 배경 + 네컷 완성 안내 → 본문(entered): 2×2 그리드 + 공유바.
// 상태 3종: 로딩(이미지 생성 대기 — 가장 중요) / 에러(재시도) / ready.
// 빈 칸(imageUrl=null): 고정 placeholder + "아직 다 발견하지 못했어" 문구.
// 형용사 톤: 백엔드 interpretation 그대로 표시(domain.md §1 긍정/중립 원칙은 서버 책임).
interface ResultViewProps {
  surveyCode: string;
  nickname: string;
  respondentCount: number;
}

export function ResultView({ surveyCode, nickname, respondentCount }: ResultViewProps) {
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

          {/* 일러스트 placeholder — Figma img_character_hamster_insight_noword(270×334) 대기.
              figma-loose: aspect-[350/332] 흰 박스로 자리만. */}
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

  // ── 결과 본문 (entered) — 2×2 그리드 ────────────────────────────────────────
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

      {/* ── 2×2 조하리 네컷 그리드 ──────────────────────────────────────── */}
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        {QUADRANTS.map(({ key }) => {
          const quadrantData = data?.quadrants?.[key];
          const imageUrl = quadrantData?.imageUrl ?? null;
          const interpretation = quadrantData?.interpretation ?? null;
          const label = QUADRANT_LABEL[key];

          return (
            <article key={key} className="flex flex-col gap-2">
              {/* 이미지 영역 */}
              {imageUrl ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                  <Image
                    src={imageUrl}
                    alt={`${label} — AI 생성 이미지`}
                    fill
                    // 백엔드 AI 생성 이미지 — CDN 호스트가 가변/미확정이라 최적화 비활성(remotePatterns 의존 제거)
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                </div>
              ) : (
                // 빈 칸 placeholder (주로 ④ unknown — domain.md §2/product-spec #6 필수 상태)
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-center px-2">
                  <span className="text-body-14-medium text-gray-200" aria-hidden>
                    🌫️
                  </span>
                  <p className="text-caption-12-medium text-gray-300">
                    아직 다 발견하지 못했어
                  </p>
                </div>
              )}

              {/* 라벨 + interpretation */}
              <div className="flex flex-col gap-1">
                <span className="text-caption-12-medium text-gray-400">{label}</span>
                {interpretation ? (
                  <p className="text-body-14-regular text-gray-700">{interpretation}</p>
                ) : (
                  <p className="text-body-14-regular text-gray-300">
                    더 많은 친구들에게 물어봐요
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ── 디스클레이머 ────────────────────────────────────────────────── */}
      <div className="mx-5 mt-4 rounded-lg border border-gray-100 bg-white px-3 py-2 text-center">
        <p className="text-body-14-medium text-gray-300">
          친구들의 답변을 바탕으로 AI가 그린 이미지예요.
          <br />
          실제와 다를 수 있어요.
        </p>
      </div>

      {/* ── 하단 고정 공유바 "btm_CTA_area" (Figma bottom0 fixed) ────────── */}
      <div className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[390px] gap-1 border-t border-gray-50 bg-white px-5 pb-6 pt-3 shadow-bar md:absolute">
        {/* figma-loose: Figma 아이콘은 copy(Edit/Copy)인데 stroke_icn은 link 아이콘 내장. 아이콘은 디자이너 SVG 확인 후 copy_icn 변형으로 교체 예정(2단계). */}
        <CtaSmall variant="stroke_icn" onClick={handleCopy} className="flex-1 border-gray-100">
          링크 복사하기
        </CtaSmall>
        <CtaSmall variant="fill" onClick={handleKakao} className="flex-1">
          카카오톡 공유하기
        </CtaSmall>
      </div>

      {/* 토스트 */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-6 mx-auto w-fit max-w-[90%] rounded-full bg-gray-900 px-4 py-2 text-center text-caption-12-medium text-white shadow-lg md:absolute"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
