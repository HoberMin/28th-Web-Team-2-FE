import { afterEach, describe, expect, it, vi } from "vitest";

import { shareKakao } from "./share";

// 공유 유틸 — shareInstagramStory·toJpegFile·loadKakao 는 F04 리디자인으로 제거됨.
// shareKakao(result-view 재공유)만 유지 → 카카오 SDK 분기 검증.

const LINK = "https://looky.my/abc123";
const IMG = "https://looky.my/assets/og-image.png";

function setClipboard(ok: boolean) {
  const writeText = ok
    ? vi.fn().mockResolvedValue(undefined)
    : vi.fn().mockRejectedValue(new Error("denied"));
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as { Kakao?: unknown }).Kakao;
});

describe("shareKakao", () => {
  it("SDK/키 없으면 링크 복사 fallback ('copied')", async () => {
    const writeText = setClipboard(true);
    // window.Kakao 미정의 + 키 미설정 → fallback

    const result = await shareKakao({
      link: LINK,
      title: "t",
      description: "d",
      imageUrl: IMG,
    });

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(LINK);
  });

  it("Kakao SDK 있으면 sendDefault 호출 + 'shared'", async () => {
    setClipboard(true);
    const sendDefault = vi.fn();
    (window as { Kakao?: unknown }).Kakao = {
      isInitialized: () => true,
      init: vi.fn(),
      Share: { sendDefault },
    };

    const result = await shareKakao({
      link: LINK,
      title: "t",
      description: "d",
      imageUrl: IMG,
    });

    expect(result).toBe("shared");
    expect(sendDefault).toHaveBeenCalledOnce();
  });
  // 공유·복사 모두 불가 — 구형 브라우저나 권한 거부
  it("SDK 없고 클립보드도 막히면 'unsupported'", async () => {
    setClipboard(false);

    const result = await shareKakao({
      link: LINK,
      title: "t",
      description: "d",
      imageUrl: IMG,
    });

    expect(result).toBe("unsupported");
  });

  it("sendDefault 가 던지면 링크 복사로 물러난다 ('copied')", async () => {
    const writeText = setClipboard(true);
    (window as { Kakao?: unknown }).Kakao = {
      isInitialized: () => true,
      init: vi.fn(),
      Share: {
        sendDefault: () => {
          throw new Error("kakao rejected");
        },
      },
    };

    const result = await shareKakao({
      link: LINK,
      title: "t",
      description: "d",
      imageUrl: IMG,
    });

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(LINK);
  });

  it("sendDefault 실패 + 복사 실패면 'error'", async () => {
    setClipboard(false);
    (window as { Kakao?: unknown }).Kakao = {
      isInitialized: () => true,
      init: vi.fn(),
      Share: {
        sendDefault: () => {
          throw new Error("kakao rejected");
        },
      },
    };

    const result = await shareKakao({
      link: LINK,
      title: "t",
      description: "d",
      imageUrl: IMG,
    });

    expect(result).toBe("error");
  });

  // feed 페이로드 모양이 틀리면 카카오가 거부해 공유 자체가 깨진다
  it("feed 페이로드를 카카오 규격대로 만든다", async () => {
    setClipboard(true);
    const sendDefault = vi.fn();
    (window as { Kakao?: unknown }).Kakao = {
      isInitialized: () => true,
      init: vi.fn(),
      Share: { sendDefault },
    };

    await shareKakao({
      link: LINK,
      title: "루키님의 인생네컷이 나왔어요!",
      description: "친구들이 본 나를 인생네컷으로. looky",
      imageUrl: IMG,
    });

    expect(sendDefault).toHaveBeenCalledWith({
      objectType: "feed",
      content: {
        title: "루키님의 인생네컷이 나왔어요!",
        description: "친구들이 본 나를 인생네컷으로. looky",
        imageUrl: IMG,
        // mobileWebUrl·webUrl 둘 다 필요 — 하나만 주면 해당 환경에서 링크가 죽는다
        link: { mobileWebUrl: LINK, webUrl: LINK },
      },
      buttons: [
        { title: "네컷 보러가기", link: { mobileWebUrl: LINK, webUrl: LINK } },
      ],
    });
  });
});
