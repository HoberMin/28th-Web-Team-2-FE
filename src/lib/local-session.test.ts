import { beforeEach, describe, expect, it } from "vitest";

import {
  isOwner,
  isSurveyDone,
  isSurveyStarted,
  markSurveyDone,
  markSurveyStarted,
  readSession,
  saveSession,
} from "./local-session";

// 비회원 식별 = surveyCode(서버 발급) + 로컬스토리지 닉네임 (domain.md §2).
describe("local-session", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("저장한 세션을 그대로 읽는다", () => {
    const session = { nickname: "송이", surveyCode: "abc123", createdAt: 1000 };
    saveSession(session);
    expect(readSession()).toEqual(session);
  });

  it("저장된 게 없으면 null", () => {
    expect(readSession()).toBeNull();
  });

  it("손상된 값이면 null (throw하지 않음)", () => {
    window.localStorage.setItem("looky.session", "{깨진 json");
    expect(readSession()).toBeNull();
  });

  it("isOwner는 내 surveyCode일 때만 true", () => {
    saveSession({ nickname: "송이", surveyCode: "mine", createdAt: 1 });
    expect(isOwner("mine")).toBe(true);
    expect(isOwner("other")).toBe(false);
  });
  // 기기 하나로 여러 링크에 참여할 수 있어 단일 값이 아니라 배열로 쌓는다
  describe("제출 완료 표시 (localStorage · 영속)", () => {
    it("기본값은 미제출", () => {
      expect(isSurveyDone("tok")).toBe(false);
    });

    it("표시한 코드만 제출로 읽힌다", () => {
      markSurveyDone("tok");
      expect(isSurveyDone("tok")).toBe(true);
      expect(isSurveyDone("other")).toBe(false);
    });

    it("여러 링크를 누적한다 (앞선 표시를 덮지 않는다)", () => {
      markSurveyDone("a");
      markSurveyDone("b");
      markSurveyDone("c");
      expect(isSurveyDone("a")).toBe(true);
      expect(isSurveyDone("b")).toBe(true);
      expect(isSurveyDone("c")).toBe(true);
    });

    it("같은 코드를 두 번 표시해도 중복 저장하지 않는다", () => {
      markSurveyDone("tok");
      markSurveyDone("tok");
      const raw = window.localStorage.getItem("looky.surveyDone");
      expect(JSON.parse(raw!)).toEqual(["tok"]);
    });

    it("손상된 값이면 빈 배열로 취급한다 (throw 없음)", () => {
      window.localStorage.setItem("looky.surveyDone", "{깨진 json");
      expect(isSurveyDone("tok")).toBe(false);
      // 이후 표시가 정상 동작해야 한다
      markSurveyDone("tok");
      expect(isSurveyDone("tok")).toBe(true);
    });
  });

  // "진행 중" 표시는 탭을 닫으면 사라져야 하므로 sessionStorage —
  // 이 구분이 [token] 페이지의 respondentInProgress 가드 전제다.
  describe("설문 시작 표시 (sessionStorage · 탭 스코프)", () => {
    it("기본값은 미시작", () => {
      expect(isSurveyStarted("tok")).toBe(false);
    });

    it("표시한 코드만 시작으로 읽힌다", () => {
      markSurveyStarted("tok");
      expect(isSurveyStarted("tok")).toBe(true);
      expect(isSurveyStarted("other")).toBe(false);
    });

    it("localStorage 가 아니라 sessionStorage 에 저장된다", () => {
      markSurveyStarted("tok");
      expect(window.sessionStorage.getItem("looky.surveyStarted")).not.toBeNull();
      expect(window.localStorage.getItem("looky.surveyStarted")).toBeNull();
    });

    it("sessionStorage 를 비우면(탭 종료 상당) 시작 표시가 사라진다", () => {
      markSurveyStarted("tok");
      window.sessionStorage.clear();
      expect(isSurveyStarted("tok")).toBe(false);
    });

    it("제출 완료 표시와 서로 독립이다", () => {
      markSurveyStarted("tok");
      expect(isSurveyStarted("tok")).toBe(true);
      expect(isSurveyDone("tok")).toBe(false);

      markSurveyDone("tok");
      window.sessionStorage.clear();
      expect(isSurveyStarted("tok")).toBe(false);
      expect(isSurveyDone("tok")).toBe(true);
    });

    it("손상된 값이면 빈 배열로 취급한다", () => {
      window.sessionStorage.setItem("looky.surveyStarted", "not json");
      expect(isSurveyStarted("tok")).toBe(false);
    });
  });
});
