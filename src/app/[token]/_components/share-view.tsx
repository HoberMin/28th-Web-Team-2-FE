"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BgCloud } from "@/components/ui/bg-cloud";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CtaSmall } from "@/components/ui/cta-small";
import { LinkIcon } from "@/components/ui/icons/link";
import { Logo } from "@/components/ui/logo";

// 공유 관리 뷰 (product-spec #4 · Figma F04 node 1212:6382) — GUI 2차 전경 정합.
// 핵심 루프: 링크를 퍼뜨려 참여자 모으기.
// 하단 버튼: [링크 아이콘 w-16] gap-2 [카카오톡 공유하기 CtaSmall fill flex-1]
// TODO(✍️): 24h 만료·전환 책임 위치(클라/서버).
// TODO(✍️): 카카오 SDK 연동 — 현재 딥링크 fallback(앱 필요, 데스크탑 미지원).
// TODO(✍️): img_character_hamster_set 에셋 미존재 → hamster_three로 임시 대체. 에셋 확보 후 교체.
interface ShareViewProps {
  surveyCode: string;
  respondentCount: number;
}

export function ShareView({ surveyCode, respondentCount }: ShareViewProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  // ── 이탈 가드 ────────────────────────────────────────────────────────────────
  // 주인공이 back을 누르면 닉네임(온보딩)으로 돌아가 버린다 → 수집 중인데 실수 이탈 방지.
  // beforeunload는 SPA back을 못 잡고 커스텀 문구도 불가 → popstate 가로채기 + 확인 모달.
  //
  // 마운트 시 가드 entry 1개 push. back을 누르면 가드가 pop되며(현재=공유 페이지) 모달만 띄운다.
  // ※ 재장전(pushState)은 popstate 핸들러 안에서 하면 일부 브라우저가 무시한다 → 신뢰성 위해
  //   "머무르기/닫힘"(이벤트 핸들러)에서 다시 쌓는다. "나가기"는 첫 페이지(/)로 명시 이동.
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

  // "나가기": 히스토리 의존 대신 첫 페이지(랜딩 /)로 명시 이동
  const handleLeave = () => {
    leavingRef.current = true;
    setLeaveConfirmOpen(false);
    router.replace("/");
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/${surveyCode}`;

  const showToast = (msg: string) => {
    setToast(msg);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const handleCopy = async () => {
    const isAndroid = /android/i.test(navigator.userAgent);
    try {
      await navigator.clipboard.writeText(link);
      if (!isAndroid) showToast("링크 복사 완료!");
    } catch {
      showToast("복사에 실패했어요. 링크를 길게 눌러 복사해주세요");
    }
  };

  // TODO(✍️): 카카오 SDK 연동 필요. 카카오 앱 키 확보 후 Kakao.Share.sendDefault() 방식으로 교체.
  const handleKakaoShare = () => {
    window.location.href = `kakaotalk://send?text=${encodeURIComponent(link)}`;
  };

  return (
    // 디자이너 #10: 로고·타이틀·캐릭터를 F01(CenteredScreen)과 동일하게 세로 중앙 정렬.
    // 위·아래 flex-1 스페이서로 콘텐츠를 가운데 두고 CTA는 바닥 고정.
    <main className="relative isolate flex min-h-full flex-col overflow-hidden bg-sky-gradient px-5 pb-6 pt-5">
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

      {/* 위 여백 가변 → 콘텐츠 세로 중앙 */}
      <div className="flex-1" aria-hidden />

      {/* Figma 830:9448: 로고 가운데 정렬 */}
      <div className="flex justify-center">
        <Logo size="sm" />
      </div>

      {/* Figma 1228:3453·3454: 타이틀 + 서브타이틀. 로고 아래 mt-8(32px), 제목↔본문 gap-3(12px). */}
      <div className="mt-8 flex flex-col gap-3 text-center">
        {/* head-point1/24 = display1(Y Spotlight) 24px, gray-900 */}
        <h1 className="text-head1-24 font-display1 text-gray-900">
          준비 완료!
          <br />
          친구들에게 링크를 보내봐요
        </h1>
        {/* body/16-medium 16px Medium gray-300 */}
        <p className="text-body-16-medium text-gray-300">
          <span className="text-blue-500">친구 3명</span>만 답하면 나만의 네컷이 완성돼요
        </p>
      </div>

      {/* 응답자 카운터 칩 + 캐릭터 일러스트 (Figma 1228:3471 기준 하단 블록).
          카운터 칩 175×33px, 아래 36px 간격 후 캐릭터 304×216px. */}
      <div className="mt-8 flex flex-col items-center gap-9">
        {/* 응답자 카운터 칩 — Figma node 1228:3472 */}
        {/* Figma 1228:3471: 175×33px, rounded-8px, bg-white, no-border, px-3 py-1, Pretendard Bold 16px blue-500 */}
        <div className="rounded-lg bg-white px-3 py-1 text-body-16-bold text-blue-500">
          지금까지 {respondentCount}명이 답했어요
        </div>
        {/* 캐릭터 일러스트 — Figma: img_character_hamster_set (304×216px).
            에셋 미존재로 hamster_three 임시 대체. 에셋 확보 후 src 교체 요망. */}
        <Image
          src="/assets/img_character_hamster_set.png"
          alt=""
          aria-hidden
          width={1072}
          height={615}
          className="h-auto w-full max-w-[304px] select-none"
        />
      </div>

      {/* 아래 여백 가변 → 콘텐츠 세로 중앙 + CTA 바닥 고정 */}
      <div className="flex-1" aria-hidden />

      {/* 공유 CTA — 단일 행: [링크 아이콘 w-16] gap-2 [카카오톡 공유하기 flex-1]
          Figma Frame 2085673267: row gap-8px. CTA_small[icn_link] 64px + CTA(카카오) 278px + gap 8px = 350. */}
      <div className="relative flex flex-col pt-7">
        {/* 토스트 — Figma 1228:3455: CTA 위 중앙, 버튼과 8px 간격(mb-2) */}
        {toast && (
          <div
            role="status"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-fit max-w-[90%] -translate-x-1/2 rounded-full bg-gray-900/70 px-7 py-2 text-center text-body-14-medium text-white"
          >
            {toast}
          </div>
        )}

        {/* 버튼 행: [링크 아이콘 w-16] gap-2 [카카오톡 공유하기 flex-1] */}
        <div className="flex flex-row items-center gap-2">
          {/* 링크 복사 — 아이콘 전용 (Figma CTA_small icon 832:11782: 64×56px) */}
          <CtaSmall
            variant="icon"
            onClick={handleCopy}
            aria-label="링크 복사"
          >
            <LinkIcon className="size-7" />
          </CtaSmall>
          {/* 카카오톡 공유 — fill variant (Figma CTA_small fill 414:13237: bg-kakao #fee500) */}
          <CtaSmall
            variant="fill"
            onClick={handleKakaoShare}
            className="flex-1"
          >
            카카오톡 공유하기
          </CtaSmall>
        </div>
      </div>
    </main>
  );
}
