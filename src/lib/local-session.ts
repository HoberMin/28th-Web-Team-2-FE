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
