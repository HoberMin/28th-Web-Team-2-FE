"use client";

import { useParams, useRouter } from "next/navigation";

import { useGetSurveyStatusAPI } from "@/apis/survey/queries";
import { isApiError } from "@/apis/error";
import { isOwner } from "@/lib/local-session";
import { Cta } from "@/components/ui/cta";

import { ExpiredView } from "./_components/expired-view";
import { ResultView } from "./_components/result-view";
import { RespondentView } from "./_components/respondent-view";
import { RetryView } from "./_components/retry-view";
import { ShareView } from "./_components/share-view";

// 단일 URL 상태머신 (domain.md §3 · product-spec §1).
// TanStack Query로 상태 조회 → resultStatus / surveyStatus 기준 분기.
// 와이어프레임 데모 스위처·?view= 오버라이드 제거.

export default function TokenPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  // ── hooks (early return 앞) ───────────────────────────────────────────────
  const owner = isOwner(token);

  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useGetSurveyStatusAPI(token, {
    // 터미널 상태면 폴링 중지, 아니면 15초마다 갱신
    refetchInterval: (query) => {
      const result = query.state.data;
      if (!result) return 15000;
      const terminal =
        result.resultStatus === "READY" ||
        result.resultStatus === "FAILED" ||
        result.resultStatus === "EXPIRED";
      return terminal ? false : 15000;
    },
  });

  // ── 1. 로딩 ──────────────────────────────────────────────────────────────
  // 디자인상 로딩 화면 없음(스켈레톤은 결과 화면 전용) → 조회 중엔 아무것도 렌더 안 함
  if (isLoading) {
    return null;
  }

  // ── 2. 에러 ──────────────────────────────────────────────────────────────
  if (error) {
    // 404: 존재하지 않는 / 만료된 링크
    if (isApiError(error) && error.isNotFound) {
      return <ExpiredView />;
    }
    // 그 외 네트워크/서버 에러
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-body-16-medium text-gray-900">
          잠시 문제가 생겼어요
        </p>
        <p className="text-body-14-regular text-gray-300">{error.message}</p>
        <Cta onClick={() => void refetch()}>다시 시도</Cta>
      </div>
    );
  }

  // ── 3. 상태 없음(방어) ────────────────────────────────────────────────────
  if (!status) {
    return <ExpiredView />;
  }

  // ── 4. resultStatus 기준 분기 ─────────────────────────────────────────────

  // READY: 결과 완성
  if (status.resultStatus === "READY") {
    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          <ResultView
            surveyCode={token}
            nickname={status.userNickname}
            respondentCount={status.peerSubmissionCount}
            resultAvailableAt={status.resultAvailableAt}
          />
        </div>
      </div>
    );
  }

  // GENERATING: AI 처리 중 — 폴링 계속
  if (status.resultStatus === "GENERATING") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
        <p className="text-body-16-medium text-gray-900">결과를 만들고 있어요</p>
        <p className="text-body-14-regular text-gray-300">
          잠시 후 자동으로 열려요
        </p>
      </div>
    );
  }

  // EXPIRED 또는 surveyStatus EXPIRED: 만료
  if (
    status.resultStatus === "EXPIRED" ||
    status.surveyStatus === "EXPIRED"
  ) {
    return <ExpiredView />;
  }

  // FAILED: AI 생성 실패
  if (status.resultStatus === "FAILED") {
    return (
      <RetryView
        nickname={status.userNickname}
        respondentCount={status.peerSubmissionCount}
        onRetry={() => router.push("/")}
      />
    );
  }

  // 주인공 + 시간 만료 + 미달: 재시도 유도
  // NOTE: resultStatus가 별도의 "미달" enum이 없으므로 remainingSeconds + peerCount로 판단
  if (
    owner &&
    status.remainingSecondsToResultOpen <= 0 &&
    status.peerSubmissionCount < status.requiredPeerSubmissionCount
  ) {
    return (
      <RetryView
        nickname={status.userNickname}
        respondentCount={status.peerSubmissionCount}
        onRetry={() => router.push("/")}
      />
    );
  }

  // 그 외 (WAITING_SELF_RESPONSE / COLLECTING_PEER_RESPONSES / WAITING_RESULT_OPEN_TIME):
  // 주인공이면 공유 뷰, 참여자면 설문 뷰
  if (owner) {
    return <ShareView surveyCode={token} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
        <RespondentView surveyCode={token} nickname={status.userNickname} />
      </div>
    </div>
  );
}
