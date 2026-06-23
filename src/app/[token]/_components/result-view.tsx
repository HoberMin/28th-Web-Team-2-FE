"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { BgCloud } from "@/components/ui/bg-cloud";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { DownloadIcon } from "@/components/ui/icons/download";
import { Logo } from "@/components/ui/logo";
import { shareKakao } from "@/lib/share";
import { QUADRANT_LABEL } from "@data/quadrants";
import { DUMMY_RESULT } from "@data/result";

// 결과 뷰 (product-spec #6 · Figma F05 노드 414:13565(게이트) / 414:13748(본문)) — GUI 전경 정합.
// 게이트(!entered): 하늘 배경 + 네컷 완성 안내 → 본문(entered): bg-white 세로스크롤 + fixed 공유바.
// 형용사 톤: 긍정/중립만 (domain.md §1). 빈 ④칸: q.empty 분기(domain 필수, Figma 미도시 → figma-loose).
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
// TODO(✍️): 정식은 게이트/본문 외에 **로딩(이미지 생성 대기 — 가장 중요)·에러** 상태 필요 (product-spec #6).
export function ResultView() {
  const [entered, setEntered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const r = DUMMY_RESULT;

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

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
      title: `${r.nickname}님의 인생네컷이 나왔어요!`,
      description: r.headline,
      imageUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}/assets/og-image.png`
          : "/assets/og-image.png",
    });
    showToast(result === "shared" ? "카카오톡 공유를 열었어요" : "링크를 복사했어요");
  };

  // ── 게이트 화면 (!entered) — Figma 노드 414:13565 ──────────────────────────
  if (!entered) {
    return (
      // figma-loose: 로고 top Figma 104px(프레임, status bar 44px 포함) → pt-16(64px) 근사.
      <main className="relative isolate flex min-h-full flex-col items-center overflow-hidden bg-sky-gradient px-5 pb-6 pt-16 text-center">
        {/* 배경: 하늘 그라데이션(Figma 그대로) + 구름(BgCloud) */}
        <BgCloud />

        <Logo />

        {/* figma-loose: 타이틀 top Figma 176px(로고 bottom 132 → 타이틀 top 176 = gap 44px) → mt-10(40px) 근사. */}
        <h1 className="mt-10 text-head1-24 font-display1 text-gray-900">
          <span className="text-blue-500">{r.nickname}</span>님의 네컷이
          <br />
          완성됐어요
        </h1>

        {/* Figma: 타이틀↔서브텍스트 gap 12px → mt-3(12px) 일치 */}
        <p className="mt-3 text-body-16-medium text-gray-300">
          친구 {r.respondentCount}명의 응답을 보러 갈까요?
        </p>

        {/* 일러스트 placeholder — 실제 일러스트는 디자이너 프레임 대기.
            figma-loose: aspect-[350/332] = Figma 흰 박스 350×332 비율(arbitrary). */}
        <div className="mt-7 flex aspect-[350/332] w-full flex-col items-center justify-center gap-1 rounded-2xl bg-white text-center">
          <span className="text-body-18-semibold text-gray-200">
            일러스트 이미지 삽입 예정
          </span>
          <span className="text-body-18-semibold text-gray-200">
            *대략적인 위치만 참고해 주세요
          </span>
        </div>

        {/* 하단 고정 블록 — Figma: CTA 단독(안내문 없음). */}
        <div className="mt-auto flex w-full flex-col gap-3 pt-8">
          <Cta onClick={() => setEntered(true)}>내 네컷 결과 보기</Cta>
        </div>
      </main>
    );
  }

  // ── 결과 본문 (entered) — Figma 노드 414:13748 ─────────────────────────────
  // bg-white 세로 스크롤. 하단 fixed 공유바 높이만큼 pb 확보.
  return (
    // figma-loose: 공유바 fixed 높이(pb-6+h-14+pt-3 ≈ 88px) → pb-28(112px)으로 여유 확보.
    <main className="relative flex min-h-full flex-col bg-white pb-28">

      {/* ── B-1. 헤더 (Figma top 44, h60) ─────────────────────────────── */}
      {/* figma-loose: Figma 로고 top 18+44=62 → pt-4(16px) 근사. */}
      <div className="flex items-center justify-between px-5 pt-4">
        <Logo size="sm" />
        {/* 다운받기 pill 버튼 — Figma: border gray-100, rounded-full, pl-3 pr-4 py-2, 아이콘+텍스트 */}
        <button
          type="button"
          aria-label="이미지 다운받기"
          className="flex items-center gap-0.5 rounded-full border border-gray-100 bg-white py-2 pl-3 pr-4"
        >
          <DownloadIcon className="size-6 text-gray-900" />
          <span className="text-body-14-medium text-gray-900">다운받기</span>
        </button>
      </div>

      {/* ── B-2. 네컷 프레임 "4cuts_frame" (Figma w358 h552) ─────────────── */}
      {/* figma-loose: 디자이너 제공 결과 네컷 샘플 합성본(result.png)을 그대로 사용.
          다크 카드·2×2 그리드·라벨 오버레이·날짜/헤드라인 캡션이 한 장에 베이크됨.
          정식 구현은 프레임은 프론트가 렌더하고 4컷 캐릭터만 서버 AI 생성물을 끼운다(domain.md §2). */}
      <div className="mx-4 mt-3">
        <Image
          src="/assets/result.png"
          alt={`${r.nickname}님의 인생네컷 — ${r.headline}`}
          width={358}
          height={552}
          priority
          className="h-auto w-full rounded-2xl"
        />
      </div>

      {/* ── B-3. 디스클레이머 (Figma top677) ──────────────────────────── */}
      <div className="mx-5 mt-3 rounded-lg border border-gray-100 bg-white px-3 py-2 text-center">
        <p className="text-body-14-medium text-gray-300">
          친구들의 답변을 바탕으로 AI가 그린 이미지로,
          <br />
          실제와 다를 수 있어요.
        </p>
      </div>

      {/* ── B-4. 종합분석 블록 (Figma top804, gap16) ────────────────────── */}
      <div className="mt-6 flex flex-col gap-4 px-5">
        {/* 타이틀 그룹 */}
        <div className="flex flex-col">
          <span className="text-body-18-medium text-gray-900">{r.nickname}님은</span>
          {/* Figma 타이틀 그룹 2번째 줄: "마음을 잘 여는 사람"(headlinePhrase). 카드 강조줄(summaryTitle)과 다른 문구. */}
          <p className="text-head1-20 font-display1 text-gray-900">{r.headlinePhrase}</p>
        </div>
        {/* 종합분석 카드 — Figma rounded14 → rounded-xl (--radius-xl = 14px), p12 → p-3 */}
        <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3">
          {/* Figma: 아이콘(20px) + "종합 분석" gray-400. 현재 아이콘 없음 → figma-loose: 아이콘 디자이너 합의 후 추가. */}
          <span className="flex items-center gap-1 text-body-14-regular text-gray-400">
            종합 분석
          </span>
          <p className="text-body-16-semibold text-gray-900">{r.summaryTitle}</p>
          <p className="text-body-16-regular text-gray-700">{r.summary}</p>
        </div>
      </div>

      {/* ── B-5. 칸별 상세 섹션 (Figma top1143, gap64px between) ───────── */}
      {/* figma-loose: gap64 → gap-16(64px) 일치 */}
      <div className="mt-6 flex flex-col gap-16 px-5">
        {r.quadrants.map((q) => (
          <article key={q.key} className="flex flex-col gap-5">
            {/* 헤더 행 */}
            <div className="flex items-center gap-2.5">
              {/* 라벨 배지 — Figma: "모두가 아는"/"친구만 아는"/"나만 아는"/"아무도 모르는" (나" 뺀 형).
                  figma-loose: ④는 "아직 모르는" (quadrants.ts 라벨 파생. Figma "아무도 모르는"은 미동기화). */}
              <span className="rounded bg-gray-50 px-2 py-0.5 text-body-14-medium text-gray-300">
                {QUADRANT_LABEL[q.key].replace(/\s*나$/, "")}
              </span>
              {/* 칸 섹션 제목 (형용사대표 + nickname 형, 예 "탐험가 송이") */}
              <span className="text-body-18-semibold text-gray-900">{q.title}</span>
            </div>

            {/* 본문 */}
            <div className="flex flex-col gap-3">
              {q.empty ? (
                // figma-loose: 빈 ④칸 처리 — domain.md §2/product-spec #6 필수 상태. Figma F05 미도시.
                <>
                  <div className="h-[124px] w-full overflow-hidden rounded-lg bg-gray-50" />
                  <p className="text-body-16-regular text-gray-700">{q.description}</p>
                </>
              ) : (
                <>
                  {/* 이미지 자리 — figma-loose: h-[124px](arbitrary, Figma 124px 그대로). 실제 AI 생성 이미지. */}
                  <div className="h-[124px] w-full overflow-hidden rounded-lg bg-gray-50" />
                  <div className="flex flex-wrap gap-2">
                    {q.adjectives.map((adj) => (
                      <span
                        key={adj}
                        className="rounded-full bg-yellow-200 px-3 py-0.5 text-body-14-medium text-yellow-800"
                      >
                        {adj}
                      </span>
                    ))}
                  </div>
                  <p className="text-body-16-regular text-gray-700">{q.description}</p>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* ── B-6. 팁 블록 (Figma top2555) ────────────────────────────────── */}
      <div className="mx-5 mt-16 flex flex-col gap-2 rounded-xl bg-gray-50 p-3">
        {/* Figma: 아이콘(20px) + "이렇게 해봐요!". 아이콘 없음 → figma-loose: 이모지 유지(디자이너 합의 전). */}
        <p className="flex items-center gap-1 text-body-16-semibold text-gray-900">
          {/* figma-loose: 아이콘 없어 이모지로 근사. 디자이너 합의 후 아이콘 컴포넌트 교체. */}
          💡 이렇게 해봐요!
        </p>
        <p className="text-body-16-regular text-gray-700">{r.tip}</p>
      </div>

      {/* ── B-7. 하단 고정 공유바 "btm_CTA_area" (Figma bottom0 fixed) ────── */}
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
