// 믹스패널 트래킹 래퍼 — KPI 검증(1차 마케팅 실험)용.
// 토큰 미설정(로컬 등) 시 초기화·트래킹 모두 조용히 무시 — 개발 환경에서 에러 없이 동작.
import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let initialized = false;

// 디버그 로그는 개발 환경에서만. 프로덕션에서 매 이벤트마다 콘솔을 찍으면
// 사용자 콘솔에 이벤트명·속성이 그대로 노출되고 노이즈만 남는다.
const isDev = process.env.NODE_ENV !== "production";

function debugLog(kind: "info" | "warn", ...args: unknown[]): void {
  if (!isDev) return;
  if (kind === "warn") console.warn(...args);
  else console.info(...args);
}

/** 앱 최초 마운트 시 1회 호출 (providers.tsx). */
export function initAnalytics(): void {
  if (initialized) return;
  if (!MIXPANEL_TOKEN) {
    debugLog("warn", "[analytics] NEXT_PUBLIC_MIXPANEL_TOKEN이 없어 믹스패널을 초기화하지 않습니다.");
    return;
  }
  mixpanel.init(MIXPANEL_TOKEN, {
    autocapture: true,
    record_sessions_percent: 100,
  });
  initialized = true;
  debugLog("info", "[analytics] 믹스패널 초기화 완료");
}

/** 커스텀 이벤트 트래킹. 이벤트명 목록은 각 페이지 주석 참조. */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) {
    debugLog("warn", `[analytics] 초기화 전이라 이벤트를 건너뜁니다: ${event}`);
    return;
  }
  mixpanel.track(event, properties);
  debugLog("info", `[analytics] track: ${event}`, properties ?? {});
}

/**
 * 유입 채널(UTM) 퍼스트터치 태깅 — 마케팅 채널별(인스타그램/에브리타임/기타) 전환 비교용.
 * register_once로 등록해 이후 페이지 이동에서 utm 없는 방문이 최초 채널을 덮어쓰지 않는다.
 * 앱 최초 마운트 시 1회 호출 (providers.tsx).
 */
export function captureUtm(): void {
  if (!initialized || typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const utmProps: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const value = params.get(key);
    if (value) utmProps[key] = value;
  }

  if (Object.keys(utmProps).length === 0) return;
  mixpanel.register_once(utmProps);
  debugLog("info", "[analytics] utm 캡처:", utmProps);
}
