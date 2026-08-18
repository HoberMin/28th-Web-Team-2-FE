import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { SubmissionStartedResponse } from "@/apis/survey/types";

import {
  clearSelfSurveyCache,
  isSelfSurveyDone,
  markSelfSurveyDone,
  readSelfSurveyCache,
  saveSelfSurveyCache,
} from "./self-survey-cache";

// 이 캐시가 막는 것: 자기 설문 도중 새로고침 시 POST 재호출(409),
// 그리고 결과 페이지에서 back 으로 설문에 재진입해 재제출하는 것.
// surveyCode 로 묶여 있어 다른 사람 설문 캐시와 섞이지 않아야 한다.

const CACHE_KEY = "looky.selfSurveySubmission";
const DONE_KEY = "looky.selfSurveyDone";

const DATA = {
  submissionId: 1,
  submissionStatus: "IN_PROGRESS",
  questions: [],
} as unknown as SubmissionStartedResponse;

describe("self-survey-cache", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  describe("읽기·쓰기", () => {
    it("저장한 뒤 같은 surveyCode 로 읽으면 데이터가 나온다", () => {
      saveSelfSurveyCache("tok", DATA);
      expect(readSelfSurveyCache("tok")).toEqual(DATA);
    });

    it("저장된 것이 없으면 null", () => {
      expect(readSelfSurveyCache("tok")).toBeNull();
    });

    it("다른 surveyCode 로 읽으면 null — 남의 설문 캐시를 쓰지 않는다", () => {
      saveSelfSurveyCache("tok", DATA);
      expect(readSelfSurveyCache("other")).toBeNull();
    });

    it("새로 저장하면 이전 캐시를 덮어쓴다 (설문은 1개만 진행)", () => {
      saveSelfSurveyCache("tok", DATA);
      const next = { ...DATA, submissionId: 2 } as SubmissionStartedResponse;
      saveSelfSurveyCache("other", next);
      expect(readSelfSurveyCache("tok")).toBeNull();
      expect(readSelfSurveyCache("other")).toEqual(next);
    });

    it("clear 하면 사라진다", () => {
      saveSelfSurveyCache("tok", DATA);
      clearSelfSurveyCache();
      expect(readSelfSurveyCache("tok")).toBeNull();
    });
  });

  describe("깨진 저장값 방어", () => {
    it("JSON 이 아니면 throw 하지 않고 null", () => {
      window.localStorage.setItem(CACHE_KEY, "{깨진 JSON");
      expect(readSelfSurveyCache("tok")).toBeNull();
    });

    it("surveyCode 필드가 없으면 null", () => {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ data: DATA }));
      expect(readSelfSurveyCache("tok")).toBeNull();
    });
  });

  describe("제출 완료 표시 (재진입 가드)", () => {
    it("기본값은 미완료", () => {
      expect(isSelfSurveyDone("tok")).toBe(false);
    });

    it("표시한 surveyCode 만 완료로 읽힌다", () => {
      markSelfSurveyDone("tok");
      expect(isSelfSurveyDone("tok")).toBe(true);
      expect(isSelfSurveyDone("other")).toBe(false);
    });

    it("캐시를 지워도 완료 표시는 남는다 — 재설문 없음(domain.md)", () => {
      markSelfSurveyDone("tok");
      saveSelfSurveyCache("tok", DATA);
      clearSelfSurveyCache();
      expect(readSelfSurveyCache("tok")).toBeNull();
      expect(isSelfSurveyDone("tok")).toBe(true);
    });

    it("완료 표시는 별도 키에 저장된다 (캐시 키와 독립)", () => {
      markSelfSurveyDone("tok");
      expect(window.localStorage.getItem(DONE_KEY)).toBe("tok");
      expect(window.localStorage.getItem(CACHE_KEY)).toBeNull();
    });
  });
});
