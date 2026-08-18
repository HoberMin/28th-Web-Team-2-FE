import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PreloadableImage } from "./preload-images";

// 다음 화면 캐릭터 이미지를 유휴 시점에 미리 받아두는 모듈.
// 핵심 계약: next/image 가 실제로 요청할 최적화 URL(srcSet/sizes)을 preload 해야 캐시가 적중한다.
//   raw <link href="/assets/x.png"> 를 넣으면 /_next/image 요청과 달라 캐시가 빗나간다.
// injected Set 이 모듈 스코프라 케이스마다 resetModules 로 새 인스턴스를 받는다.

const getImageProps = vi.fn();
vi.mock("next/image", () => ({
  getImageProps: (...a: unknown[]) => getImageProps(...a),
}));

const IMAGE: PreloadableImage = {
  src: "/assets/img_character_hamster_up.png",
  width: 272,
  height: 334,
};

/** srcSet 을 내주는 정상 응답 */
function givenOptimized() {
  getImageProps.mockImplementation(({ src }: { src: string }) => ({
    props: {
      src: `/_next/image?url=${encodeURIComponent(src)}&w=640`,
      srcSet: `/_next/image?url=${encodeURIComponent(src)}&w=320 1x, /_next/image?url=${encodeURIComponent(src)}&w=640 2x`,
      sizes: "272px",
    },
  }));
}

const links = () =>
  Array.from(document.head.querySelectorAll('link[rel="preload"]'));

async function loadModule() {
  vi.resetModules();
  return import("./preload-images");
}

describe("preload-images", () => {
  beforeEach(() => {
    getImageProps.mockReset();
    document.head.innerHTML = "";
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("preloadImages", () => {
    it("최적화 URL 의 srcSet·sizes 를 imagesrcset/imagesizes 로 넣는다", async () => {
      givenOptimized();
      const { preloadImages } = await loadModule();

      preloadImages([IMAGE]);

      const [link] = links();
      expect(link).toBeDefined();
      // as 는 jsdom 이 속성으로 반영하지 않는다 → 프로퍼티로 확인 (rel 은 반영되어 셀렉터가 동작)
      expect((link as HTMLLinkElement).as).toBe("image");
      expect(link.getAttribute("imagesrcset")).toContain("/_next/image");
      expect(link.getAttribute("imagesizes")).toBe("272px");
    });

    // 현재 화면 리소스를 밀어내지 않아야 한다
    it("fetchpriority=low 로 데우기만 한다", async () => {
      givenOptimized();
      const { preloadImages } = await loadModule();

      preloadImages([IMAGE]);

      expect(links()[0].getAttribute("fetchpriority")).toBe("low");
    });

    it("srcSet 이 없으면 href 로 단일 URL 을 넣는다", async () => {
      getImageProps.mockReturnValue({
        props: { src: "/_next/image?url=x&w=640" },
      });
      const { preloadImages } = await loadModule();

      preloadImages([IMAGE]);

      const [link] = links();
      expect(link.getAttribute("href")).toBe("/_next/image?url=x&w=640");
      expect(link.getAttribute("imagesrcset")).toBeNull();
    });

    it("같은 src 를 두 번 넘겨도 link 를 하나만 만든다", async () => {
      givenOptimized();
      const { preloadImages } = await loadModule();

      preloadImages([IMAGE]);
      preloadImages([IMAGE]);
      preloadImages([IMAGE, IMAGE]);

      expect(links()).toHaveLength(1);
    });

    it("여러 이미지를 넘기면 각각 link 를 만든다", async () => {
      givenOptimized();
      const { preloadImages } = await loadModule();

      preloadImages([
        IMAGE,
        { ...IMAGE, src: "/assets/img_character_hamster_down.png" },
      ]);

      expect(links()).toHaveLength(2);
    });

    it("빈 배열이면 아무것도 만들지 않는다", async () => {
      givenOptimized();
      const { preloadImages } = await loadModule();

      preloadImages([]);

      expect(links()).toHaveLength(0);
      expect(getImageProps).not.toHaveBeenCalled();
    });
  });

  describe("usePreloadImages — 유휴 시점 실행", () => {
    it("requestIdleCallback 이 있으면 그것으로 미룬다", async () => {
      givenOptimized();
      const idleCbs: (() => void)[] = [];
      vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
        idleCbs.push(cb);
        return 1;
      });
      vi.stubGlobal("cancelIdleCallback", vi.fn());

      const { usePreloadImages } = await loadModule();
      renderHook(() => usePreloadImages([IMAGE]));

      // 아직 유휴 콜백이 실행되지 않았으므로 link 도 없다
      expect(links()).toHaveLength(0);
      idleCbs[0]();
      expect(links()).toHaveLength(1);

      vi.unstubAllGlobals();
    });

    it("requestIdleCallback 이 없으면 setTimeout 으로 대체한다", async () => {
      givenOptimized();
      vi.stubGlobal("requestIdleCallback", undefined);
      vi.useFakeTimers();

      const { usePreloadImages } = await loadModule();
      renderHook(() => usePreloadImages([IMAGE]));

      expect(links()).toHaveLength(0);
      vi.advanceTimersByTime(200);
      expect(links()).toHaveLength(1);

      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it("언마운트 시 예약된 유휴 콜백을 취소한다", async () => {
      givenOptimized();
      const cancel = vi.fn();
      vi.stubGlobal("requestIdleCallback", () => 42);
      vi.stubGlobal("cancelIdleCallback", cancel);

      const { usePreloadImages } = await loadModule();
      const { unmount } = renderHook(() => usePreloadImages([IMAGE]));
      unmount();

      expect(cancel).toHaveBeenCalledWith(42);
      vi.unstubAllGlobals();
    });
  });
});
