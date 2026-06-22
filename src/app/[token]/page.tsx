"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { isOwner, readSession } from "@/lib/local-session";

import { ExpiredView } from "./_components/expired-view";
import { ResultView } from "./_components/result-view";
import { RespondentView } from "./_components/respondent-view";
import { RetryView } from "./_components/retry-view";
import { ShareView } from "./_components/share-view";

// 단일 URL 상태머신 (domain.md §3 · wireframe-spec §1).
// 분기 = (1) localStorage 닉네임 매칭 → 주인공/참여자  (2) 서버 상태 → 수집중/결과/미달/만료.
// 와이어프레임은 서버 상태가 없으므로 ?view= 로 데모. 정식은 TanStack Query로 상태 조회.
type View = "share" | "respondent" | "result" | "retry" | "expired";

const VIEWS: { key: View; label: string }[] = [
  { key: "share", label: "공유(주인공)" },
  { key: "respondent", label: "참여자" },
  { key: "result", label: "결과" },
  { key: "retry", label: "미달" },
  { key: "expired", label: "만료" },
];

export default function TokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [view, setView] = useState<View | null>(null);
  const [nickname, setNickname] = useState("민규");

  useEffect(() => {
    // 데모 오버라이드 우선
    const override = new URLSearchParams(window.location.search).get(
      "view",
    ) as View | null;
    const owner = isOwner(token);
    if (owner) setNickname(readSession()?.nickname ?? "나");

    if (override && VIEWS.some((v) => v.key === override)) {
      setView(override);
    } else {
      // 기본 분기: 주인공이면 공유, 아니면 참여자.
      // TODO(✍️): 정식은 TanStack Query로 토큰 상태 조회 → 만료/없음이면 "expired",
      //           24h 경과+3건↑이면 "result", 미달이면 "retry"로 분기. 조회 실패=ExpiredView.
      setView(owner ? "share" : "respondent");
    }
  }, [token]);

  if (view === null) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* ⚠️ 와이어프레임 리뷰용 상태 스위처 — 정식 구현 시 제거 */}
      <div className="flex flex-wrap gap-1 border-b border-gray-100 bg-gray-50 px-3 py-2">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`rounded-md px-2 py-1 text-caption-12-medium transition-colors ${
              view === v.key
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-400"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "share" && (
        <ShareView
          nickname={nickname}
          token={token}
          respondentCount={2}
          hoursLeft={18}
        />
      )}
      {view === "respondent" && <RespondentView nickname={nickname} />}
      {view === "result" && <ResultView />}
      {view === "retry" && (
        <RetryView
          nickname={nickname}
          respondentCount={2}
          onRetry={() => setView("share")}
        />
      )}
      {view === "expired" && <ExpiredView />}
    </div>
  );
}
