import { getImageProps } from "next/image";
import { useEffect } from "react";

export interface PreloadableImage {
  src: string;
  width: number;
  height: number;
}

// 이미 주입한 src 는 중복 <link> 를 만들지 않도록 모듈 스코프에 기록
const injected = new Set<string>();

/**
 * next/image 가 실제로 요청할 최적화 URL(srcSet/sizes)을 그대로 <link rel="preload"> 로 미리 받아둔다.
 * 원본 PNG(`/assets/*.png`)가 아니라 `/_next/image` 변형을 받아야 화면 전환 시 캐시가 적중한다
 * (raw <link href="/assets/x.png"> 는 next/image 요청 URL과 달라 캐시가 빗나간다).
 */
export function preloadImages(images: PreloadableImage[]): void {
  if (typeof document === "undefined") return;
  for (const image of images) {
    if (injected.has(image.src)) continue;
    injected.add(image.src);

    const { props } = getImageProps({ alt: "", ...image });
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    // 현재 화면의 리소스를 밀어내지 않도록 낮은 우선순위로 데우기만 한다
    link.setAttribute("fetchpriority", "low");
    if (props.srcSet) {
      link.setAttribute("imagesrcset", props.srcSet);
      if (props.sizes) link.setAttribute("imagesizes", props.sizes);
    } else if (typeof props.src === "string") {
      link.href = props.src;
    }
    document.head.appendChild(link);
  }
}

interface IdleWindow {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (handle: number) => void;
}

/**
 * 현재 화면이 그려진 뒤(유휴 시점) 다음 단계 캐릭터 이미지를 미리 받아둔다.
 * `images` 는 매 렌더 새 배열이 되지 않도록 **모듈 스코프 상수**로 전달할 것.
 */
export function usePreloadImages(images: PreloadableImage[]): void {
  useEffect(() => {
    const idle = window as Window & IdleWindow;
    if (idle.requestIdleCallback) {
      const handle = idle.requestIdleCallback(() => preloadImages(images));
      return () => idle.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => preloadImages(images), 200);
    return () => window.clearTimeout(timer);
  }, [images]);
}
