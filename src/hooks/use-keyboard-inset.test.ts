import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useKeyboardInset } from "./use-keyboard-inset";

// 모바일 가상 키보드가 덮은 높이를 visualViewport 로 추적한다.
// 계산식: window.innerHeight - visualViewport.height - visualViewport.offsetTop
// 하단 고정 CTA 를 이 값만큼 올려 키보드 위에 붙이는 데 쓰인다.

type Listener = () => void;

/** visualViewport 스텁 — resize/scroll 이벤트를 직접 발화할 수 있다 */
function stubVisualViewport(initial: { height: number; offsetTop: number }) {
  const listeners: Record<string, Listener[]> = { resize: [], scroll: [] };
  const vv = {
    height: initial.height,
    offsetTop: initial.offsetTop,
    addEventListener: (type: string, cb: Listener) => {
      listeners[type]?.push(cb);
    },
    removeEventListener: (type: string, cb: Listener) => {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== cb);
    },
  };
  Object.defineProperty(window, "visualViewport", {
    value: vv,
    configurable: true,
    writable: true,
  });
  return {
    vv,
    fire(type: "resize" | "scroll") {
      act(() => {
        for (const l of listeners[type] ?? []) l();
      });
    },
    listenerCount: () => listeners.resize.length + listeners.scroll.length,
  };
}

const INNER_HEIGHT = 844;

describe("useKeyboardInset", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", {
      value: INNER_HEIGHT,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "visualViewport", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it("키보드가 닫혀 있으면 0 (보이는 높이 = 레이아웃 높이)", () => {
    stubVisualViewport({ height: INNER_HEIGHT, offsetTop: 0 });
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
  });

  it("키보드가 열리면 덮은 높이를 돌려준다", () => {
    const vp = stubVisualViewport({ height: INNER_HEIGHT, offsetTop: 0 });
    const { result } = renderHook(() => useKeyboardInset());

    vp.vv.height = 500; // 키보드가 344px 덮음
    vp.fire("resize");

    expect(result.current).toBe(INNER_HEIGHT - 500);
  });

  it("offsetTop(위쪽 스크롤분)을 빼고 계산한다", () => {
    const vp = stubVisualViewport({ height: INNER_HEIGHT, offsetTop: 0 });
    const { result } = renderHook(() => useKeyboardInset());

    vp.vv.height = 500;
    vp.vv.offsetTop = 44;
    vp.fire("scroll");

    expect(result.current).toBe(INNER_HEIGHT - 500 - 44);
  });

  // 음수가 나오면 하단 요소가 화면 밖으로 밀린다
  it("계산이 음수면 0으로 잘라낸다", () => {
    const vp = stubVisualViewport({ height: INNER_HEIGHT, offsetTop: 0 });
    const { result } = renderHook(() => useKeyboardInset());

    vp.vv.height = INNER_HEIGHT + 200; // 보이는 높이가 더 큰 비정상 상황
    vp.fire("resize");

    expect(result.current).toBe(0);
  });

  it("소수점 높이는 정수로 반올림한다", () => {
    const vp = stubVisualViewport({ height: INNER_HEIGHT, offsetTop: 0 });
    const { result } = renderHook(() => useKeyboardInset());

    vp.vv.height = 500.4; // 덮은 높이 343.6 → 344
    vp.fire("resize");

    expect(result.current).toBe(344);
  });

  it("visualViewport 미지원(구형·데스크탑)이면 항상 0", () => {
    Object.defineProperty(window, "visualViewport", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
  });

  it("언마운트 시 리스너를 정리한다", () => {
    const vp = stubVisualViewport({ height: INNER_HEIGHT, offsetTop: 0 });
    const { unmount } = renderHook(() => useKeyboardInset());
    expect(vp.listenerCount()).toBe(2); // resize + scroll

    unmount();
    expect(vp.listenerCount()).toBe(0);
  });
});
