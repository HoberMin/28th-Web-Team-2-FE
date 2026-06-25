"use client";

import { useEffect, useRef, useState } from "react";

import { BgCloud } from "@/components/ui/bg-cloud";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Cta } from "@/components/ui/cta";
import { CtaSmall } from "@/components/ui/cta-small";
import { DownloadIcon } from "@/components/ui/icons/download";
import { Logo } from "@/components/ui/logo";
import { Tooltip } from "@/components/ui/tooltip";

import { ShareCards } from "./share-cards";

// 공유 관리 뷰 (product-spec #4 · Figma F04 node 414:13419) — GUI 1차 전경 정합.
// 핵심 루프: 링크를 퍼뜨려 참여자 모으기.
// 하단 버튼: [내 링크 복사하기 flex-1] + [다운로드 아이콘 w-16] 단일 행.
// 다운로드는 인스타 스토리 공유용 이미지 저장(story-share.png). <a download> 방식.
// 배경(하늘 그라데이션·Union)·중앙 일러스트는 디자이너 별도 프레임 대기 → placeholder만.
// 룰/Figma에서 느슨하게 처리한 지점은 `figma-loose:` 주석으로 표기(디자이너 합의용).
// TODO(✍️): 24h 만료·전환 책임 위치(클라/서버).
// TODO(✍️): product-spec #4의 수집 게이지·카운트다운(응답수/남은시간)은 Figma GUI 1차 F04에 UI가 없어 미구현.
// 디자인 합의되면 status의 peerSubmissionCount/requiredPeerSubmissionCount/remainingSecondsToResultOpen로 추가.
interface ShareViewProps {
  surveyCode: string;
}

export function ShareView({ surveyCode }: ShareViewProps) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  // ── 이탈 가드 ────────────────────────────────────────────────────────────────
  // 주인공이 back을 누르면 닉네임(온보딩)으로 돌아가 버린다 → 수집 중인데 실수 이탈 방지.
  // beforeunload는 SPA back을 못 잡고 커스텀 문구도 불가 → popstate 가로채기 + 확인 모달.
  //
  // 마운트 시 가드 entry 1개 push. back을 누르면 가드가 pop되며(현재=공유 페이지) 모달만 띄운다.
  // ※ 재장전(pushState)은 popstate 핸들러 안에서 하면 일부 브라우저가 무시한다 → 신뢰성 위해
  //   "머무르기/닫힘"(이벤트 핸들러)에서 다시 쌓는다. "나가기"는 history.back 한 번으로 이탈.
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const guardPushedRef = useRef(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!guardPushedRef.current) {
      window.history.pushState({ lookyShareGuard: true }, "");
      guardPushedRef.current = true;
    }
    const onPop = () => {
      if (leavingRef.current) return;
      setLeaveConfirmOpen(true); // 가드 pop됨 → 확인 모달 (재장전은 닫힐 때)
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 모달 닫힘(머무르기·Esc·바깥 클릭) → 가드를 다시 쌓아 다음 back도 잡는다
  const handleConfirmOpenChange = (open: boolean) => {
    setLeaveConfirmOpen(open);
    if (!open) window.history.pushState({ lookyShareGuard: true }, "");
  };

  // "나가기": 현재(공유 페이지)에서 한 번 back → 설문 진입 직전(닉네임)으로
  const handleLeave = () => {
    leavingRef.current = true;
    setLeaveConfirmOpen(false);
    window.history.back();
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/${surveyCode}`;
  // 인스타 스토리 공유용 세로형(1080×1920) 이미지 — 다운로드 버튼으로 저장
  const storyImageUrl = `${origin}/assets/story-share.png`;

  const showToast = (msg: string) => {
    setToast(msg);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("링크 복사 완료!");
    } catch {
      showToast("복사에 실패했어요. 링크를 길게 눌러 복사해주세요");
    }
  };

  // 인스타 스토리 공유용 이미지를 <a download>로 저장.
  // 동일 출처(origin/assets/)라 fetch 없이 앵커 download 속성 직접 사용.
  // 주의: <a download>는 자산 누락(404)을 동기적으로 검출하지 못함 — DOM 예외만 방어.
  const handleDownload = () => {
    try {
      const a = document.createElement("a");
      a.href = storyImageUrl;
      a.download = "looky-story.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("이미지를 저장했어요");
    } catch {
      showToast("이미지 저장에 실패했어요. 다시 시도해주세요");
    }
  };

  return (
    // figma-loose: 로고 top Figma 80px(프레임, status bar 44px 포함) → pt-9(36px) 근사
    <main className="relative isolate flex min-h-full flex-col overflow-hidden bg-sky-gradient px-5 pb-6 pt-9">
      {/* 배경: 하늘 그라데이션(Figma 그대로) + 구름(BgCloud) */}
      <BgCloud />

      {/* 이탈 확인 모달 — back 가로채기로 노출 */}
      <ConfirmDialog
        open={leaveConfirmOpen}
        onOpenChange={handleConfirmOpenChange}
        title="친구들 답변을 모으는 중이에요"
        description="지금 나가도 링크는 그대로 살아있어요. 정말 나갈까요?"
        cancelLabel="머무르기"
        confirmLabel="나가기"
        onConfirm={handleLeave}
      />

      {/* Figma 830:9448: 로고 가운데 정렬 */}
      <div className="flex justify-center">
        <Logo size="sm" />
      </div>

      {/* Figma 830:9449: 로고+제목+본문 가운데 정렬. 로고 아래 mt-8(32px), 제목↔본문 gap-3(12px). */}
      <div className="mt-8 flex flex-col gap-3 text-center">
        {/* Figma 627:9619: head-point1/24 = display1(Y Spotlight) 24px, 색 순수 black(#000) — DSGN 검증 대상(F01은 gray-900) */}
        <h1 className="text-head1-24 font-display1 text-black">
          친구에게 링크를 공유하고
          <br />
          네컷을 받아보세요!
        </h1>
        {/* Figma 627:9620: body/16-medium 16px Medium gray-300 (1줄) */}
        <p className="text-body-16-medium text-gray-300">
          답이 모이면, 24시간 뒤 네컷 결과가 열려요
        </p>
      </div>

      {/* 공유 안내 카드 캐러셀 (Figma 830:9452). 제목블록↔카드 56px → mt-14.
          캐러셀은 화면 끝까지(full-bleed) — -mx-5로 부모 px-5를 상쇄해 좌우 peek가 화면 가장자리에 붙게 한다. */}
      <div className="mt-14 -mx-5">
        <ShareCards />
      </div>

      {/* 공유 CTA — 단일 행: [링크 복사 flex-1] gap-2 [다운로드 아이콘 w-16]
          Figma Frame 2085673268: row gap-8px, justify-center. CTA 278px + 다운로드 64px + gap 8px = 350.
          모바일: CTA flex-1, 다운로드 고정 w-16(64px). */}
      <div className="relative mt-auto flex flex-col pt-7">
        {/* 토스트 — Figma F04(627:9624): CTA 위 중앙, 버튼과 8px 간격(mb-2) */}
        {toast && (
          <div
            role="status"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-fit max-w-[90%] -translate-x-1/2 rounded-full bg-gray-900/70 px-7 py-2 text-center text-body-14-medium text-white"
          >
            {toast}
          </div>
        )}

        {/* 다운로드 버튼 위 툴팁 — 상시 안내 요소 (토스트와 별개)
            Figma 832:14436: 꼬리가 다운로드 버튼(오른쪽)을 가리키도록 tailAlign="right".
            figma-loose: 툴팁 전체를 오른쪽 정렬해 다운로드 버튼(w-16) 위에 위치 */}
        <div className="mb-4 flex justify-end">
          <Tooltip tailAlign="right">
            <b>인스타 스토리</b> 공유용 이미지 저장하기!
          </Tooltip>
        </div>

        {/* 버튼 행: 링크 복사 + 다운로드 */}
        <div className="flex flex-row items-center gap-2">
          <Cta onClick={handleCopy} className="flex-1">
            내 링크 복사하기
          </Cta>
          {/* 아이콘 전용 variant: w-16(64px) × h-14(56px), border gray-200, bg white */}
          <CtaSmall
            variant="icon"
            onClick={handleDownload}
            aria-label="인스타 스토리 공유용 이미지 저장"
          >
            {/* figma-loose: Figma 28×28px 아이콘 → size-7(28px) */}
            <DownloadIcon className="size-7" />
          </CtaSmall>
        </div>
      </div>
    </main>
  );
}
