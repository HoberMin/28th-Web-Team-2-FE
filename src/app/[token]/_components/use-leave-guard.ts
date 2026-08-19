"use client";

import { useEffect, useRef, useState } from "react";

// 수집 중 화면에서 주인공이 back 을 눌러 실수로 이탈하는 것을 막는 가드.
//
// 왜 이렇게 하나: beforeunload 는 SPA back 을 잡지 못하고 커스텀 문구도 못 쓴다.
// → 마운트 시 가짜 history 엔트리를 1개 쌓아두고, back 이 그 엔트리를 pop 하면
//   화면은 그대로 둔 채 확인 모달만 띄운다.
//
// 재장전을 popstate 핸들러 안에서 하면 일부 브라우저가 무시한다 → 신뢰성을 위해
// "머무르기/모달 닫힘"(사용자 이벤트) 시점에 다시 쌓는다.

const GUARD_STATE = { lookyShareGuard: true };

interface UseLeaveGuardOptions {
  /** 사용자가 "나가기"를 골랐을 때 실제 이동 처리 */
  onLeave: () => void;
}

export function useLeaveGuard({ onLeave }: UseLeaveGuardOptions) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const guardPushedRef = useRef(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!guardPushedRef.current) {
      window.history.pushState(GUARD_STATE, "");
      guardPushedRef.current = true;
    }
    const onPop = () => {
      if (leavingRef.current) return; // 이미 나가는 중이면 모달을 띄우지 않는다
      setConfirmOpen(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /** 모달 열림 상태 변경 — 닫히면(머무르기·Esc·바깥 클릭) 가드를 다시 쌓는다 */
  const handleOpenChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) window.history.pushState(GUARD_STATE, "");
  };

  /** "나가기" — 히스토리에 기대지 않고 호출자가 준 이동을 실행한다 */
  const leave = () => {
    leavingRef.current = true;
    setConfirmOpen(false);
    onLeave();
  };

  return { confirmOpen, handleOpenChange, leave };
}
