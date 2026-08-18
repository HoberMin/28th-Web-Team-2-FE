import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// analytics 는 모듈 로드 시점에 토큰을 읽고 initialized 를 모듈 스코프에 들고 있다.
// → 케이스마다 resetModules + 동적 import 로 새 모듈 인스턴스를 받아야 한다.

const mixpanel = {
  init: vi.fn(),
  track: vi.fn(),
  register_once: vi.fn(),
};

vi.mock("mixpanel-browser", () => ({ default: mixpanel }));

const TOKEN_ENV = "NEXT_PUBLIC_MIXPANEL_TOKEN";

/**
 * 토큰(+환경)을 세팅한 뒤 새 모듈 인스턴스를 로드한다.
 * NODE_ENV 는 타입상 read-only 라 직접 대입할 수 없어 vi.stubEnv 를 쓴다
 * (afterEach 의 unstubAllEnvs 로 복원).
 */
async function loadAnalytics(
  token: string | undefined,
  nodeEnv?: "development" | "production" | "test",
) {
  vi.resetModules();
  vi.stubEnv(TOKEN_ENV, token);
  if (nodeEnv !== undefined) vi.stubEnv("NODE_ENV", nodeEnv);
  return import("./analytics");
}

/** location.search 를 갈아끼운다 */
function setSearch(search: string) {
  window.history.replaceState({}, "", `/${search}`);
}

describe("analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 로그는 검증 대상이 아니면 조용히 — 테스트 출력이 지저분해지지 않게
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    setSearch("");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("initAnalytics", () => {
    it("토큰이 있으면 믹스패널을 초기화한다", async () => {
      const { initAnalytics } = await loadAnalytics("tok-123");
      initAnalytics();
      expect(mixpanel.init).toHaveBeenCalledWith("tok-123", {
        autocapture: true,
        record_sessions_percent: 100,
      });
    });

    it("여러 번 불러도 한 번만 초기화한다", async () => {
      const { initAnalytics } = await loadAnalytics("tok-123");
      initAnalytics();
      initAnalytics();
      initAnalytics();
      expect(mixpanel.init).toHaveBeenCalledOnce();
    });

    // 로컬 개발 환경 — 토큰 없이도 에러 없이 굴러가야 한다
    it("토큰이 없으면 초기화하지 않고 경고만 남긴다", async () => {
      const { initAnalytics } = await loadAnalytics(undefined);
      initAnalytics();
      expect(mixpanel.init).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe("track", () => {
    it("초기화 후에는 이벤트를 그대로 넘긴다", async () => {
      const { initAnalytics, track } = await loadAnalytics("tok-123");
      initAnalytics();
      track("result_view", { method: "copy" });
      expect(mixpanel.track).toHaveBeenCalledWith("result_view", {
        method: "copy",
      });
    });

    it("properties 없이도 호출된다", async () => {
      const { initAnalytics, track } = await loadAnalytics("tok-123");
      initAnalytics();
      track("landing_view");
      expect(mixpanel.track).toHaveBeenCalledWith("landing_view", undefined);
    });

    it("초기화 전이면 이벤트를 버린다 (토큰 없는 환경에서 크래시 방지)", async () => {
      const { track } = await loadAnalytics(undefined);
      track("landing_view");
      expect(mixpanel.track).not.toHaveBeenCalled();
    });
  });

  describe("captureUtm — 퍼스트터치 유입 채널", () => {
    it("utm 3종을 register_once 로 등록한다", async () => {
      const { initAnalytics, captureUtm } = await loadAnalytics("tok-123");
      initAnalytics();
      setSearch("?utm_source=instagram&utm_medium=story&utm_campaign=launch");
      captureUtm();
      expect(mixpanel.register_once).toHaveBeenCalledWith({
        utm_source: "instagram",
        utm_medium: "story",
        utm_campaign: "launch",
      });
    });

    it("있는 파라미터만 담는다", async () => {
      const { initAnalytics, captureUtm } = await loadAnalytics("tok-123");
      initAnalytics();
      setSearch("?utm_source=everytime");
      captureUtm();
      expect(mixpanel.register_once).toHaveBeenCalledWith({
        utm_source: "everytime",
      });
    });

    it("utm 파라미터가 없으면 아무것도 등록하지 않는다", async () => {
      const { initAnalytics, captureUtm } = await loadAnalytics("tok-123");
      initAnalytics();
      setSearch("?foo=bar");
      captureUtm();
      expect(mixpanel.register_once).not.toHaveBeenCalled();
    });

    it("빈 문자열 값은 무시한다", async () => {
      const { initAnalytics, captureUtm } = await loadAnalytics("tok-123");
      initAnalytics();
      setSearch("?utm_source=");
      captureUtm();
      expect(mixpanel.register_once).not.toHaveBeenCalled();
    });

    it("utm 관련 외 파라미터는 섞이지 않는다", async () => {
      const { initAnalytics, captureUtm } = await loadAnalytics("tok-123");
      initAnalytics();
      setSearch("?utm_source=instagram&utm_term=x&gclid=y");
      captureUtm();
      expect(mixpanel.register_once).toHaveBeenCalledWith({
        utm_source: "instagram",
      });
    });

    it("초기화 전이면 아무것도 하지 않는다", async () => {
      const { captureUtm } = await loadAnalytics(undefined);
      setSearch("?utm_source=instagram");
      captureUtm();
      expect(mixpanel.register_once).not.toHaveBeenCalled();
    });
  });

  // 디버그 로그가 프로덕션 사용자 콘솔에 이벤트명·속성을 흘리지 않아야 한다
  describe("디버그 로그 환경 게이팅", () => {
    it("프로덕션에서는 track 로그를 찍지 않는다", async () => {
      const { initAnalytics, track } = await loadAnalytics("tok-123", "production");
      initAnalytics();
      track("result_view", { method: "copy" });
      expect(console.info).not.toHaveBeenCalled();
      // 트래킹 자체는 정상 동작해야 한다
      expect(mixpanel.track).toHaveBeenCalledWith("result_view", { method: "copy" });
    });

    it("프로덕션에서는 토큰 누락 경고도 찍지 않는다", async () => {
      const { initAnalytics } = await loadAnalytics(undefined, "production");
      initAnalytics();
      expect(console.warn).not.toHaveBeenCalled();
      expect(mixpanel.init).not.toHaveBeenCalled();
    });

    it("프로덕션에서는 utm 캡처 로그를 찍지 않는다", async () => {
      const { initAnalytics, captureUtm } = await loadAnalytics("tok-123", "production");
      initAnalytics();
      setSearch("?utm_source=instagram");
      captureUtm();
      expect(console.info).not.toHaveBeenCalled();
      expect(mixpanel.register_once).toHaveBeenCalledWith({ utm_source: "instagram" });
    });

    it("개발 환경에서는 로그를 찍는다 (로컬 디버깅 유지)", async () => {
      const { initAnalytics, track } = await loadAnalytics("tok-123", "development");
      initAnalytics();
      track("result_view");
      expect(console.info).toHaveBeenCalled();
    });
  });
});
