import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { shareInstagramStory, shareKakao } from "./share";

// 공유 유틸 — 인스타(이미지+링크 복사) / 카카오(SDK or 복사 fallback).
// 브라우저 API(clipboard·navigator.share·fetch·Kakao SDK)를 모킹해 폴백 분기를 검증.

const LINK = "https://looky.my/abc123";
const IMG = "https://looky.my/mascot.png";

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

function setNavigatorShare(opts: { canShare?: boolean; share?: () => Promise<void> }) {
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: opts.canShare === undefined ? undefined : () => opts.canShare!,
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: opts.share ?? vi.fn().mockResolvedValue(undefined),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as { Kakao?: unknown }).Kakao;
});

describe("shareInstagramStory", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(["x"], { type: "image/png" })),
      }),
    );
  });

  it("Web Share(files) 지원 시 'shared' + 링크는 클립보드로", async () => {
    const writeText = setClipboard(true);
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigatorShare({ canShare: true, share });

    const result = await shareInstagramStory({ link: LINK, imageUrl: IMG });

    expect(result).toBe("shared");
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(share).toHaveBeenCalledOnce();
  });

  it("Web Share 미지원이면 'copied' (링크만 복사)", async () => {
    const writeText = setClipboard(true);
    setNavigatorShare({ canShare: undefined });

    const result = await shareInstagramStory({ link: LINK, imageUrl: IMG });

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(LINK);
  });

  it("공유·복사 모두 불가면 'unsupported'", async () => {
    setClipboard(false);
    setNavigatorShare({ canShare: undefined });

    const result = await shareInstagramStory({ link: LINK, imageUrl: IMG });

    expect(result).toBe("unsupported");
  });
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
