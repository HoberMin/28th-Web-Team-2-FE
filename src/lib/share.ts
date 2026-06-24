// 공유 유틸 — 핵심 유입 루프 (domain.md §1).
// shareInstagramStory·loadKakao·toJpegFile·KakaoSDK 는 F04 버튼 재구성으로 제거됨.
// shareKakao 는 result-view.tsx(F05 결과 재공유)에서 사용 중이라 유지.

export type ShareResult =
  | "shared" // 네이티브 공유 시트 열림
  | "copied" // 링크만 클립보드 복사됨 (fallback)
  | "unsupported" // 공유·복사 모두 불가
  | "error";

// --- Kakao SDK 최소 타입 (any 회피) ---
interface KakaoLink {
  mobileWebUrl: string;
  webUrl: string;
}
interface KakaoSDK {
  isInitialized: () => boolean;
  init: (jsKey: string) => void;
  Share: {
    sendDefault: (settings: {
      objectType: "feed";
      content: {
        title: string;
        description: string;
        imageUrl: string;
        link: KakaoLink;
      };
      buttons?: { title: string; link: KakaoLink }[];
    }) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

function loadKakao(): Promise<KakaoSDK | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Kakao?.isInitialized()) return Promise.resolve(window.Kakao);
  if (!KAKAO_JS_KEY) return Promise.resolve(null);

  return new Promise((resolve) => {
    const init = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }
      resolve(window.Kakao ?? null);
    };

    const existing = document.getElementById(
      "kakao-sdk",
    ) as HTMLScriptElement | null;
    if (existing) {
      if (window.Kakao) init();
      else existing.addEventListener("load", init);
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-sdk";
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = init;
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

/** 카카오톡 공유 (feed). 키 미설정/SDK 실패 시 링크 복사 fallback */
export async function shareKakao({
  link,
  title,
  description,
  imageUrl,
}: {
  link: string;
  title: string;
  description: string;
  imageUrl: string;
}): Promise<ShareResult> {
  const kakao = await loadKakao();
  if (!kakao?.Share) {
    try {
      await navigator.clipboard.writeText(link);
      return "copied";
    } catch {
      return "unsupported";
    }
  }

  try {
    const linkObj: KakaoLink = { mobileWebUrl: link, webUrl: link };
    kakao.Share.sendDefault({
      objectType: "feed",
      content: { title, description, imageUrl, link: linkObj },
      buttons: [{ title: "네컷 보러가기", link: linkObj }],
    });
    return "shared";
  } catch {
    try {
      await navigator.clipboard.writeText(link);
      return "copied";
    } catch {
      return "error";
    }
  }
}
