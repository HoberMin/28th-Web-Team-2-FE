"use client";

import { useEffect, useState } from "react";

/**
 * 모바일 가상 키보드가 화면 아래쪽을 가린 높이(px)를 visualViewport 기준으로 추적한다.
 *
 * 키보드가 열리면 레이아웃 뷰포트(`window.innerHeight`)는 그대로지만
 * 보이는 영역(`visualViewport.height`)이 줄어든다 → 그 차이가 키보드가 덮은 높이.
 * CTA 등 하단 고정 요소를 이 값만큼 위로 올려 키보드 위에 붙인다.
 *
 * visualViewport 미지원(구형) · 데스크탑에서는 항상 0을 반환.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // 레이아웃 - 보이는 높이 - 위쪽 스크롤분 = 아래쪽(키보드)이 덮은 높이
      const overlap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(Math.max(0, Math.round(overlap)));
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
