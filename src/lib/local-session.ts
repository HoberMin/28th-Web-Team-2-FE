// 비회원 식별 — 서버 계정 없음. 주인공 기기에 닉네임+surveyCode만 저장 (domain.md §2).
// surveyCode는 서버가 발급 (추측 불가능, 순번 ID 금지).

const KEY = "looky.session";

export interface LocalSession {
  nickname: string;
  /** 서버 발급 surveyCode (추측 불가능한 토큰) */
  surveyCode: string;
  createdAt: number;
}

export function readSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: LocalSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

/** 이 surveyCode가 내 기기에서 만든 것인지 = 주인공/참여자 구분 (domain.md §2) */
export function isOwner(surveyCode: string): boolean {
  return readSession()?.surveyCode === surveyCode;
}

// 참여자가 이 surveyCode에 대한 설문을 이미 제출했는지 — 기기당 여러 링크 참여 가능하므로 토큰 배열로 저장.
// 설문 도중 상위 폴링이 GENERATING/READY로 바뀌어도 제출 전이면 로딩·결과 화면으로 넘기지 않기 위한 가드.
const SURVEY_DONE_KEY = "looky.surveyDone";

function readSurveyDoneCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SURVEY_DONE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markSurveyDone(surveyCode: string): void {
  if (typeof window === "undefined") return;
  const codes = new Set(readSurveyDoneCodes());
  codes.add(surveyCode);
  window.localStorage.setItem(SURVEY_DONE_KEY, JSON.stringify([...codes]));
}

export function isSurveyDone(surveyCode: string): boolean {
  return readSurveyDoneCodes().includes(surveyCode);
}

// 이 탭 세션에서 참여자가 설문 플로우에 "진입(시작)"했는지.
// isSurveyDone(localStorage·영속)과 구분되는 일시적 "진행 중" 표시라 sessionStorage 사용 — 탭 닫으면 사라짐.
// 용도: 설문 시작 전이면 서버 첫 status를 그대로 따르고(READY면 결과로 감),
//       일단 시작하면 폴링이 GENERATING/READY로 바뀌어도 설문 화면에서 튕기지 않게 보호.
const SURVEY_STARTED_KEY = "looky.surveyStarted";

function readSurveyStartedCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SURVEY_STARTED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markSurveyStarted(surveyCode: string): void {
  if (typeof window === "undefined") return;
  const codes = new Set(readSurveyStartedCodes());
  codes.add(surveyCode);
  window.sessionStorage.setItem(SURVEY_STARTED_KEY, JSON.stringify([...codes]));
}

export function isSurveyStarted(surveyCode: string): boolean {
  return readSurveyStartedCodes().includes(surveyCode);
}
