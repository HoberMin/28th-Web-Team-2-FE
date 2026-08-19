"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { BgCloud } from "@/components/ui/bg-cloud";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CtaSmall } from "@/components/ui/cta-small";
import { LinkIcon } from "@/components/ui/icons/link";
import { Logo } from "@/components/ui/logo";

import { useLeaveGuard } from "./use-leave-guard";
import { useShareAnalytics } from "./use-share-analytics";
import { useShareLink } from "./use-share-link";

// 공유 관리 뷰 (product-spec #4 · Figma F04 node 1212:6382) — GUI 2차 전경 정합.
// 핵심 루프: 링크를 퍼뜨려 참여자 모으기.
// 하단 버튼: [링크 아이콘 w-16] gap-2 [카카오톡 공유하기 CtaSmall fill flex-1]
// 전환 조건: 응답 3건이 채워지면 결과로 (시간 만료 개념 없음 — 2026-07-05 확정).
//   전환 판정은 [token]/page.tsx 가 서버 status 폴링으로 수행 → 이 뷰는 수집 중만 담당.
// TODO(✍️): 존재하지 않는 토큰의 404 규격 vs 안내 화면 분리(domain.md §4).
// 카카오 공유: shareKakao(SDK feed) 사용. 동작 전제 = 운영 앱 JS키 + 콘솔 웹 도메인 등록.
// TODO(✍️): img_character_hamster_set 에셋 미존재 → hamster_three로 임시 대체. 에셋 확보 후 교체.
interface ShareViewProps {
  surveyCode: string;
  respondentCount: number;
}

export function ShareView({ surveyCode, respondentCount }: ShareViewProps) {
  const router = useRouter();

  useShareAnalytics(respondentCount);
  const { toast, copyLink, shareToKakao } = useShareLink(surveyCode);
  const { confirmOpen, handleOpenChange, leave } = useLeaveGuard({
    // 히스토리에 기대지 않고 첫 페이지(랜딩)로 명시 이동
    onLeave: () => router.replace("/"),
  });

  return (
    // 디자이너 #10: 로고·타이틀·캐릭터를 F01(CenteredScreen)과 동일하게 세로 중앙 정렬.
    // 위·아래 flex-1 스페이서로 콘텐츠를 가운데 두고 CTA는 바닥 고정.
    <main className="relative isolate flex min-h-full flex-col overflow-hidden bg-sky-gradient px-5 pb-6 pt-5">
      {/* 배경: 하늘 그라데이션(Figma 그대로) + 구름(BgCloud) */}
      <BgCloud />

      {/* 이탈 확인 모달 — back 가로채기로 노출 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={handleOpenChange}
        title="친구들 답변을 모으는 중이에요"
        description="지금 나가도 링크는 그대로 살아있어요. 정말 나갈까요?"
        cancelLabel="머무르기"
        confirmLabel="나가기"
        onConfirm={leave}
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
          className="h-auto w-full max-w-76 select-none"
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
            onClick={copyLink}
            aria-label="링크 복사"
          >
            <LinkIcon className="size-7" />
          </CtaSmall>
          {/* 카카오톡 공유 — fill variant (Figma CTA_small fill 414:13237: bg-kakao #fee500) */}
          <CtaSmall
            variant="fill"
            onClick={shareToKakao}
            className="flex-1"
          >
            카카오톡 공유하기
          </CtaSmall>
        </div>
      </div>
    </main>
  );
}
