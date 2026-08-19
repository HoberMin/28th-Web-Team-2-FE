"use client";

import { useEffect, useState } from "react";

// "눌러봐" 힌트 오버레이 — 본문 진입 1초 후 1회성으로 뜬다.
// 한 번 닫으면 다시 뜨지 않는다(다시 뜨면 성가시다).

const DELAY_MS = 1000;

export function useTapHint(active: boolean) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active || shown) return;
    const timer = window.setTimeout(() => {
      setVisible(true);
      setShown(true);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, shown]);

  return { visible, dismiss: () => setVisible(false) };
}
