"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { CtaSmall } from "@/components/ui/cta-small";
import type { QuadrantKey } from "@data/quadrants";

// F05 카드 확대 모달 — 앞면(1268-7404) → 뒷면(1268-7422) 플립 (스펙 §0·§4·§5·§7).
// 시퀀스: opening(카드 위치→중앙, 1.2s, layoutId 공유) → open(0.4s hold) → flipping(rotateY 0.6s) → back.
// 닫기: 딤/카드 탭 or ESC → onClose (AnimatePresence exit이 layoutId로 원위치까지 역재생).
type FlipPhase = "opening" | "open" | "flipping" | "back";

interface ResultCardModalProps {
  quadrantKey: QuadrantKey;
  frontLabel: string;
  nickname: string;
  imageUrl: string | null;
  definitionKeyword: string | null;
  adjectiveKeywords: string[];
  interpretation: string | null;
  onClose: () => void;
  onShareCopy: () => void;
  onShareKakao: () => void;
}

export function ResultCardModal({
  quadrantKey,
  frontLabel,
  nickname,
  imageUrl,
  definitionKeyword,
  adjectiveKeywords,
  interpretation,
  onClose,
  onShareCopy,
  onShareKakao,
}: ResultCardModalProps) {
  const [phase, setPhase] = useState<FlipPhase>("opening");

  // ESC 닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // open(hold 0.4s) → flipping 전이
  useEffect(() => {
    if (phase !== "open") return;
    const holdTimer = window.setTimeout(() => setPhase("flipping"), 400);
    return () => window.clearTimeout(holdTimer);
  }, [phase]);

  // flipping(0.6s) → back 전이
  useEffect(() => {
    if (phase !== "flipping") return;
    const flipTimer = window.setTimeout(() => setPhase("back"), 600);
    return () => window.clearTimeout(flipTimer);
  }, [phase]);

  const isEmpty = !imageUrl && !interpretation;
  const isFlipped = phase === "flipping" || phase === "back";
  const title = definitionKeyword ? `${definitionKeyword} ${nickname}` : nickname;

  return (
    <>
      {/* 딤 오버레이 — 탭하면 닫힘. footer(공유바)는 이보다 높은 z-index로 항상 위에 유지 */}
      <motion.div
        className="fixed inset-0 z-30 bg-black/60 md:absolute"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
        role="presentation"
      />

      {/* 카드 컨테이너 — 화면 세로·가로 중앙(Figma 202=844프레임 정중앙, 상태바 없는 앱은 중앙정렬로 정합) */}
      <div className="pointer-events-none fixed inset-0 z-30 mx-auto flex w-full max-w-[390px] items-center justify-center md:absolute">
        <motion.div
          layoutId={`f05-card-${quadrantKey}`}
          transition={{ duration: phase === "opening" ? 1.2 : 0.4 }}
          onLayoutAnimationComplete={() => {
            if (phase === "opening") setPhase("open");
          }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${frontLabel} 상세`}
          className="pointer-events-auto h-[440px] w-[324px]"
          style={{ perspective: 1200 }}
        >
          <motion.div
            className="relative size-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            exit={{ rotateY: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 앞면 (Figma 1268-7404) */}
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-white bg-white"
              style={{ backfaceVisibility: "hidden" }}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={`${frontLabel} — AI 생성 이미지`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="324px"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gray-50">
                  <span className="text-body-16-medium text-gray-200" aria-hidden>
                    🌫️
                  </span>
                </div>
              )}
              <span className="absolute bottom-[14px] left-[14px] rounded-lg bg-black/50 px-3 py-1.5 text-body-16-semibold text-white">
                {frontLabel}
              </span>
            </div>

            {/* 뒷면 (Figma 1268-7422) */}
            <div
              className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border-2 border-white bg-white pt-[18px]"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              {/* Figma: 좌 18 / w284 (우 22, 비대칭) */}
              <div className="ml-[18px] flex w-[284px] flex-col gap-7">
                <div className="relative h-[180px] w-full overflow-hidden rounded-[14px] border border-gray-100">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${frontLabel} — AI 생성 이미지`}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="284px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gray-50">
                      <span className="text-body-16-medium text-gray-200" aria-hidden>
                        🌫️
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <p className="text-head1-24 font-display1 text-gray-900">{title}</p>
                    {adjectiveKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {adjectiveKeywords.map((adj, i) => (
                          <span
                            key={`${adj}-${i}`}
                            className="rounded-full bg-yellow-200 px-3 py-0.5 text-body-14-medium text-yellow-800"
                          >
                            {adj}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isEmpty ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-body-16-regular text-gray-700">
                        아직 너를 다 발견하지 못했어
                        <br />
                        다른 사람에게도 물어봐
                      </p>
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CtaSmall
                          variant="stroke_icn"
                          onClick={onShareCopy}
                          className="flex-1 border-gray-100"
                        >
                          링크 복사하기
                        </CtaSmall>
                        <CtaSmall variant="fill" onClick={onShareKakao} className="flex-1">
                          카카오톡 공유하기
                        </CtaSmall>
                      </div>
                    </div>
                  ) : (
                    <p className="text-body-16-regular text-gray-700">{interpretation}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
