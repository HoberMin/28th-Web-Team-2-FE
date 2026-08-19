import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 공유 안내 캐러셀 — 자동재생 2초 · 무한 루프(양끝 클론) · 스와이프 · 인디케이터 동기화.
// 300줄 최대 파일인데 테스트가 없어, 분리 전 동작을 고정한다.

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock("@/lib/preload-images", () => ({ usePreloadImages: () => {} }));

import { ShareCards } from "./share-cards";

const AUTOPLAY_MS = 2000;
const CARD_COUNT = 3;
/** 실 카드 3장 + 앞뒤 클론 1장씩 */
const SLIDE_COUNT = CARD_COUNT + 2;

let reduceMotion = false;

/** jsdom 의 matchMedia 를 우리가 제어하는 구현으로 교체 */
function stubMatchMedia() {
  const listeners: (() => void)[] = [];
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reduceMotion : false,
      media: query,
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener: () => {},
    }),
  );
}

/**
 * jsdom 에는 PointerEvent 가 없다 — fireEvent.pointerMove 를 쓰면 clientX 가 전달되지 않아
 * 드래그 거리가 NaN 이 되고 스와이프가 성립하지 않는다.
 * clientX 를 실어 보내는 MouseEvent 로 pointer* 타입을 직접 발화한다(React 는 타입으로 매핑).
 */
function firePointer(el: Element, type: string, clientX: number) {
  const ev = new MouseEvent(type, { clientX, bubbles: true });
  Object.defineProperty(ev, "pointerId", { value: 1 });
  act(() => {
    el.dispatchEvent(ev);
  });
}

const indicators = () => screen.getAllByRole("button", { name: /안내 카드 보기$/ });
const activeIndicator = () =>
  indicators().findIndex((b) => b.getAttribute("aria-current") === "true");
/** 캐러셀 뷰포트 (aria-label 에 현재 위치가 담긴다) */
const viewport = () => screen.getByRole("group");
/** 트랙 = transform 이 걸린 요소 */
const track = () => viewport().firstElementChild as HTMLElement;

describe("ShareCards", () => {
  beforeEach(() => {
    reduceMotion = false;
    stubMatchMedia();
    // jsdom 은 포인터 캡처를 구현하지 않는다
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("구조", () => {
    it("실 카드 3장 + 양끝 클론 2장 = 5칸을 렌더한다", () => {
      render(<ShareCards />);
      expect(track().children).toHaveLength(SLIDE_COUNT);
    });

    it("인디케이터는 실 카드 수만큼(3개)", () => {
      render(<ShareCards />);
      expect(indicators()).toHaveLength(CARD_COUNT);
    });

    it("첫 카드에서 시작한다", () => {
      render(<ShareCards />);
      expect(activeIndicator()).toBe(0);
      expect(viewport()).toHaveAttribute("aria-label", "공유 안내 1/3");
    });

    // 클론이 낭독되면 같은 안내가 두 번 읽힌다
    it("양끝 클론은 스크린리더에서 숨긴다", () => {
      render(<ShareCards />);
      const slides = Array.from(track().children);
      expect(slides[0]).toHaveAttribute("aria-hidden", "true");
      expect(slides[slides.length - 1]).toHaveAttribute("aria-hidden", "true");
    });

    it("3번 카드 카피는 '바로'(24시간 폐기 반영)", () => {
      render(<ShareCards />);
      // 실 카드 + 클론이 있어 같은 문구가 2번 나온다
      expect(
        screen.getAllByText("3명 이상 모이면 바로 내 링크로 와!").length,
      ).toBeGreaterThan(0);
      expect(screen.queryByText(/24시간/)).not.toBeInTheDocument();
    });
  });

  describe("자동재생", () => {
    it("2초마다 다음 카드로 넘어간다", () => {
      render(<ShareCards />);
      expect(activeIndicator()).toBe(0);

      act(() => vi.advanceTimersByTime(AUTOPLAY_MS));
      expect(activeIndicator()).toBe(1);

      act(() => vi.advanceTimersByTime(AUTOPLAY_MS));
      expect(activeIndicator()).toBe(2);
    });

    it("2초 전에는 넘어가지 않는다", () => {
      render(<ShareCards />);
      act(() => vi.advanceTimersByTime(AUTOPLAY_MS - 1));
      expect(activeIndicator()).toBe(0);
    });

    it("aria-label 이 현재 위치를 따라간다", () => {
      render(<ShareCards />);
      act(() => vi.advanceTimersByTime(AUTOPLAY_MS));
      expect(viewport()).toHaveAttribute("aria-label", "공유 안내 2/3");
    });

    it("prefers-reduced-motion 이면 자동재생하지 않는다", () => {
      reduceMotion = true;
      stubMatchMedia();
      render(<ShareCards />);

      act(() => vi.advanceTimersByTime(AUTOPLAY_MS * 3));
      expect(activeIndicator()).toBe(0);
    });
  });

  describe("무한 루프 (클론 → 실 카드 점프)", () => {
    /** 카드 한 장 넘김 — 2초씩 나눠 진행해야 타이머 재무장이 정확히 반영된다 */
    const tick = () => act(() => vi.advanceTimersByTime(AUTOPLAY_MS));

    it("끝에서 처음으로 되돌아오며 끊기지 않는다", () => {
      render(<ShareCards />);
      const seen = [activeIndicator()];
      for (let i = 0; i < 6; i++) {
        tick();
        seen.push(activeIndicator());
      }
      // 클론을 지나 계속 순환한다 — 어느 지점에서도 멈추지 않는다
      expect(seen).toEqual([0, 1, 2, 0, 1, 2, 0]);
    });

    it("클론 도달 후 트랜지션 종료 시 실 카드로 점프해도 보이는 카드가 그대로다", () => {
      render(<ShareCards />);
      tick();
      tick();
      tick(); // 클론(뒤)을 지나 실 첫 카드 위치
      const before = activeIndicator();

      act(() => {
        fireEvent.transitionEnd(track(), { propertyName: "transform" });
      });
      expect(activeIndicator()).toBe(before);
    });

    it("transform 이 아닌 트랜지션 종료는 무시한다 (자식 이벤트 오발화 방지)", () => {
      render(<ShareCards />);
      act(() => vi.advanceTimersByTime(AUTOPLAY_MS));
      const before = activeIndicator();

      act(() => {
        fireEvent.transitionEnd(track(), { propertyName: "opacity" });
      });
      expect(activeIndicator()).toBe(before);
    });
  });

  describe("인디케이터 내비게이션", () => {
    it("탭하면 해당 카드로 이동한다", () => {
      render(<ShareCards />);
      fireEvent.click(indicators()[2]);
      expect(activeIndicator()).toBe(2);
      expect(viewport()).toHaveAttribute("aria-label", "공유 안내 3/3");
    });

    // WCAG 2.4.7 — 키보드 사용자가 어느 인디케이터에 있는지 보여야 한다
    it("인디케이터에 포커스 링이 있다", () => {
      render(<ShareCards />);
      for (const b of indicators()) {
        expect(b.className).toMatch(/focus-visible:ring/);
      }
    });

    it("각 인디케이터에 순번 라벨이 있다", () => {
      render(<ShareCards />);
      expect(
        screen.getByRole("button", { name: "1번째 안내 카드 보기" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "3번째 안내 카드 보기" }),
      ).toBeInTheDocument();
    });
  });

  describe("스와이프", () => {
    const START_X = 100;

    /**
     * 드래그(임계값 50px). 이벤트를 하나씩 발화한다 — 한 배치로 묶으면 move 의 setDrag 가
     * flush 되지 않아 up 핸들러가 낡은 drag(0)을 읽는다. 실제 브라우저에선 틱이 나뉜다.
     */
    const swipe = (dx: number) => {
      const vp = viewport();
      firePointer(vp, "pointerdown", START_X);
      firePointer(vp, "pointermove", START_X + dx);
      firePointer(vp, "pointerup", START_X + dx);
    };

    it("왼쪽으로 충분히 밀면 다음 카드", () => {
      render(<ShareCards />);
      swipe(-80);
      expect(activeIndicator()).toBe(1);
    });

    it("오른쪽으로 충분히 밀면 이전 카드", () => {
      render(<ShareCards />);
      fireEvent.click(indicators()[2]);
      swipe(80);
      expect(activeIndicator()).toBe(1);
    });

    it("임계값 이하 드래그는 카드를 넘기지 않는다", () => {
      render(<ShareCards />);
      swipe(-30);
      expect(activeIndicator()).toBe(0);
    });

    it("드래그 중에는 자동재생이 멈춘다", () => {
      render(<ShareCards />);
      firePointer(viewport(), "pointerdown", START_X);

      act(() => vi.advanceTimersByTime(AUTOPLAY_MS));
      act(() => vi.advanceTimersByTime(AUTOPLAY_MS));
      expect(activeIndicator()).toBe(0);
    });
  });
});
