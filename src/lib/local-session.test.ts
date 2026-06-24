import { beforeEach, describe, expect, it } from "vitest";

import {
  isOwner,
  readSession,
  saveSession,
} from "./local-session";

// 비회원 식별 = surveyCode(서버 발급) + 로컬스토리지 닉네임 (domain.md §2).
describe("local-session", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
});
