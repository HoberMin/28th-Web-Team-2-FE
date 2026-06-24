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
});
