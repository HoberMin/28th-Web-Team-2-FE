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

export interface SurveyResultRawResponse {
  surveyCode: string;
  resultStatus: ResultStatus;
  /** resultStatus !== "READY"이면 null. 내용 없는 칸(주로 UNKNOWN)은 키가 생략될 수 있음 */
  quadrantImageUrls: Partial<Record<BackendQuadrant, string>> | null;
  /** resultStatus !== "READY"이면 null. 내용 없는 칸은 키가 생략될 수 있음 */
  quadrantInterpretations: Partial<Record<BackendQuadrant, string>> | null;
}

// ─── 결과 조회 (정규화 후) ───────────────────────────────────────────────────

export interface QuadrantData {
  imageUrl: string | null;
  interpretation: string | null;
}

export interface SurveyResultResponse {
  surveyCode: string;
  resultStatus: ResultStatus;
  /** READY 아닐 때 null */
  quadrants: Record<QuadrantKey, QuadrantData> | null;
}
