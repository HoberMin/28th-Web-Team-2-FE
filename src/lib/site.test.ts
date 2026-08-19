import { afterEach, describe, expect, it, vi } from "vitest";

// SITE_URL 은 모듈 로드 시점에 env 를 읽는다 → resetModules + 동적 import 로 검증.

const ENV = "NEXT_PUBLIC_SITE_URL";

async function loadSite(value?: string) {
  vi.resetModules();
  vi.stubEnv(ENV, value);
  return import("./site");
}

describe("SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("env 미설정이면 운영 도메인", async () => {
    const { SITE_URL } = await loadSite(undefined);
    expect(SITE_URL).toBe("https://looky.my");
  });

  // 프리뷰 배포에서 운영 도메인이 박힌 OG·canonical 이 나가는 것을 막는다
  it("env 가 있으면 그 값을 쓴다", async () => {
    const { SITE_URL } = await loadSite("https://preview.looky.my");
    expect(SITE_URL).toBe("https://preview.looky.my");
  });

  it("new URL() 에 넣을 수 있는 절대 URL 이다 (metadataBase 전제)", async () => {
    const { SITE_URL } = await loadSite(undefined);
    expect(() => new URL(SITE_URL)).not.toThrow();
    expect(new URL(SITE_URL).protocol).toBe("https:");
  });

  it("끝에 슬래시가 없다 — `${SITE_URL}/sitemap.xml` 조합이 //로 깨지지 않게", async () => {
    const { SITE_URL } = await loadSite(undefined);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});
