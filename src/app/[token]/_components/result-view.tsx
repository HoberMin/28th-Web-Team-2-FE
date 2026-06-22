"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { shareKakao } from "@/lib/share";
import { QUADRANT_LABEL } from "@data/quadrants";
import { DUMMY_RESULT } from "@data/result";

// 결과 뷰 (product-spec #6) — 게이트(네컷 완성 안내) → 본문(인생네컷 + 설명문).
// 형용사 톤: 긍정/중립만 (domain.md §1). 빈 칸(④)은 고정 이미지로 대체.
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
          ? `${window.location.origin}/mascot.png`
          : "/mascot.png",
    });
    showToast(result === "shared" ? "카카오톡 공유를 열었어요" : "링크를 복사했어요");
  };

  if (!entered) {
    return (
      <main className="flex min-h-full flex-col items-center px-5 pb-8 pt-20 text-center">
        <h1 className="text-head2-24 font-display2 text-gray-900">
          {r.nickname}님의 네컷이 완성됐어요
        </h1>
        <p className="mt-3 text-body-14-regular text-gray-300">
          {r.respondentCount}명의 친구들이
          <br />
          응답해준 결과 보러 갈까요?
        </p>
        <div className="mt-8 aspect-square w-full rounded-2xl bg-gray-100" />
        <div className="mt-auto w-full pt-8">
          <Button
            size="lg"
            onClick={() => setEntered(true)}
            className="h-13 w-full rounded-2xl text-body-16-semibold"
          >
            네컷 보기
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-full flex-col px-5 pb-8 pt-6">
      {/* 상단: 로고 + 저장 */}
      <div className="flex items-center justify-between">
        <span className="text-head1-18 font-display1 text-blue-500">LOOKY</span>
        <button
          type="button"
          aria-label="이미지 저장"
          className="flex size-9 items-center justify-center rounded-lg bg-gray-50 text-gray-700"
        >
          ↓
        </button>
      </div>

      {/* 인생네컷 2×2 그리드 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {r.quadrants.map((q) => (
          <div
            key={q.key}
            className="relative flex aspect-square items-end justify-start overflow-hidden rounded-xl bg-gray-100 p-2"
          >
            <span className="rounded-md bg-blue-100 px-2 py-1 text-caption-12-medium text-gray-700">
              {QUADRANT_LABEL[q.key]}
            </span>
          </div>
        ))}
      </div>

      {/* 캡션 */}
      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        <h1 className="text-head2-20 font-display2 text-gray-900">
          {r.headline}
        </h1>
        <span className="text-caption-12-regular text-gray-300">
          {r.createdAt}
        </span>
      </div>

      {/* 종합 분석 */}
      {/* TODO(✍️): headline에서 닉네임 빼 조립하는 방식은 취약 — 정식은 표시 문구 별도 필드로. */}
      <section className="mt-6 flex flex-col gap-2">
        <h2 className="text-body-16-semibold text-gray-900">
          {r.nickname}님은 {r.headline.replace(r.nickname, "").trim()} 사람
        </h2>
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-caption-12-medium text-blue-500">+ 종합 분석</p>
          <p className="mt-1 text-body-14-regular text-gray-700">{r.summary}</p>
        </div>
      </section>

      {/* 칸별 상세 카드 */}
      <section className="mt-6 flex flex-col gap-6">
        {r.quadrants.map((q) => (
          <article key={q.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-gray-100 px-2 py-1 text-caption-12-medium text-gray-400">
                {QUADRANT_LABEL[q.key]}
              </span>
            </div>
            <div className="aspect-video w-full rounded-xl bg-gray-100" />
            {q.empty ? (
              <p className="text-body-14-regular text-gray-300">
                {q.description}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {q.adjectives.map((adj) => (
                    <span
                      key={adj}
                      className="rounded-md bg-blue-100 px-2 py-1 text-caption-12-medium text-gray-700"
                    >
                      {adj}
                    </span>
                  ))}
                </div>
                <p className="text-body-14-regular text-gray-700">
                  {q.description}
                </p>
              </>
            )}
          </article>
        ))}
      </section>

      {/* 팁 */}
      <section className="mt-6 rounded-2xl bg-gray-50 p-4">
        <p className="text-body-14-medium text-gray-900">💡 이렇게 해보면 어때요</p>
        <p className="mt-1 text-body-14-regular text-gray-700">{r.tip}</p>
      </section>

      {/* 하단 CTA */}
      <div className="mt-8 flex gap-3">
        <Button
          size="lg"
          variant="outline"
          onClick={handleCopy}
          className="h-13 flex-1 rounded-2xl border-gray-100 text-body-14-medium text-gray-700"
        >
          복사
        </Button>
        <Button
          size="lg"
          onClick={handleKakao}
          className="h-13 flex-[2] rounded-2xl text-body-16-semibold"
        >
          카톡 공유
        </Button>
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
