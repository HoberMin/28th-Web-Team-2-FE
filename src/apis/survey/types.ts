import type { QuadrantKey } from "@data/quadrants";

// ─── 공통 열거형 ────────────────────────────────────────────────────────────

export type SurveyStatus =
  | "DRAFT"
  | "COLLECTING"
  | "CLOSED"
  | "EXPIRED";

export type ResultStatus =
  | "WAITING_SELF_RESPONSE"
  | "COLLECTING_PEER_RESPONSES"
  | "WAITING_RESULT_OPEN_TIME"
  | "GENERATING"
  | "READY"
  | "FAILED"
  | "EXPIRED";

export type SubmitterType = "SELF" | "PEER";

export type SubmissionStatus = "IN_PROGRESS" | "COMPLETED";

// 백엔드 raw quadrant 키 (대문자)
export type BackendQuadrant = "OPEN" | "BLIND" | "HIDDEN" | "UNKNOWN";

// 백엔드 대문자 → 레포 소문자 QuadrantKey 매핑 상수
export const BACKEND_QUADRANT_MAP: Record<BackendQuadrant, QuadrantKey> = {
  OPEN: "open",
  BLIND: "blind",
  HIDDEN: "hidden",
  UNKNOWN: "unknown",
} as const;

// ─── 설문 생성 ───────────────────────────────────────────────────────────────

export interface CreateSurveyRequest {
  /** 1~10자 */
  userNickname: string;
}

export interface CreateSurveyResponse {
  surveyCode: string;
  shareUrl: string;
  userNickname: string;
  surveyStatus: SurveyStatus;
  resultAvailableAt: string;
  createdAt: string;
}

// ─── 설문 문항 ───────────────────────────────────────────────────────────────

export interface AnswerOption {
  answerOptionId: number;
  sequence: number;
  content: string;
}

export interface SurveyQuestion {
  questionId: number;
  sequence: number;
  content: string;
  options: AnswerOption[];
}

// ─── 제출 시작 ───────────────────────────────────────────────────────────────

export interface SubmissionStartedResponse {
  submissionId: number;
  submitterType: SubmitterType;
  submissionStatus: SubmissionStatus;
  targetNickname: string;
  questions: SurveyQuestion[];
}

// ─── 답변 제출 ───────────────────────────────────────────────────────────────

export interface AnswerEntry {
  questionId: number;
  answerOptionId: number;
}

export interface SubmitAnswersRequest {
  /** 최소 1개 */
  answers: AnswerEntry[];
}

export interface SubmissionCompletedResponse {
  submissionId: number;
  submitterType: SubmitterType;
  submissionStatus: SubmissionStatus;
  submittedAt: string;
}

// ─── 설문 상태 조회 ──────────────────────────────────────────────────────────

export interface SurveyStatusResponse {
  surveyCode: string;
  userNickname: string;
  surveyStatus: SurveyStatus;
  resultStatus: ResultStatus;
  selfSubmitted: boolean;
  peerSubmissionCount: number;
  requiredPeerSubmissionCount: number;
  resultAvailableAt: string;
  remainingSecondsToResultOpen: number;
  shareUrl: string;
  resultUrl: string;
}

// ─── 결과 조회 (백엔드 raw) ──────────────────────────────────────────────────

/** quadrants 맵의 칸별 상세 (READY일 때만). 내용 없는 칸은 키 자체가 생략될 수 있음 */
export interface QuadrantResultRaw {
  definitionKeyword: string;
  adjectiveKeywords: string[];
  interpretation: string;
  imageUrl: string;
}

export interface SurveyResultRawResponse {
  surveyCode: string;
  resultStatus: ResultStatus;
  /** resultStatus !== "READY"이면 null. 내용 없는 칸(주로 UNKNOWN)은 키가 생략될 수 있음. quadrants의 imageUrl 요약본 */
  quadrantImageUrls: Partial<Record<BackendQuadrant, string>> | null;
  /** resultStatus !== "READY"이면 null. 내용 없는 칸은 키가 생략될 수 있음. quadrants의 interpretation 요약본 */
  quadrantInterpretations: Partial<Record<BackendQuadrant, string>> | null;
  /** 종합 분석 중첩 객체. READY 아닐 때 null */
  overall: {
    keyword: string;
    analysisTitle: string;
    analysisBody: string;
    tip: string;
  } | null;
  /** 종합 키워드 — "송이님은" 아래 타이틀. READY 아닐 때 null */
  overallKeyword: string | null;
  /** 종합 분석 한줄정리. READY 아닐 때 null */
  overallAnalysisTitle: string | null;
  /** 종합 분석 본문. READY 아닐 때 null */
  overallAnalysis: string | null;
  /** Tip 카드 본문. READY 아닐 때 null */
  actionTip: string | null;
  /** 칸별 상세(정의키워드·형용사·해설·이미지). READY 아닐 때 null, 내용 없는 칸은 키 생략 */
  quadrants: Partial<Record<BackendQuadrant, QuadrantResultRaw>> | null;
}

// ─── 결과 조회 (정규화 후) ───────────────────────────────────────────────────

export interface QuadrantData {
  /** 칸 정의 키워드(예: "탐험가"). 내용 없는 칸이면 null */
  definitionKeyword: string | null;
  /** 형용사 칩. 내용 없는 칸이면 [] */
  adjectiveKeywords: string[];
  imageUrl: string | null;
  interpretation: string | null;
}

export interface SurveyResultResponse {
  surveyCode: string;
  resultStatus: ResultStatus;
  /** READY 아닐 때 null */
  overallKeyword: string | null;
  /** READY 아닐 때 null */
  overallAnalysisTitle: string | null;
  /** READY 아닐 때 null */
  overallAnalysis: string | null;
  /** READY 아닐 때 null */
  actionTip: string | null;
  /** READY 아닐 때 null. 4칸 모두 키 존재(내용 없는 칸은 필드가 null/빈배열) */
  quadrants: Record<QuadrantKey, QuadrantData> | null;
}
