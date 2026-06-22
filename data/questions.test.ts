import { describe, expect, it } from "vitest";

import { DUMMY_QUESTIONS, NEUTRAL_CHOICE, pickQuestions } from "./questions";

// 설문 문항 풀 — 5지선다 상황극, 출제는 N개 (domain.md §2).
describe("설문 문항 풀", () => {
  it("모든 문항은 5지선다", () => {
    for (const q of DUMMY_QUESTIONS) {
      expect(q.choices).toHaveLength(5);
    }
  });

  it("문항 id는 고유하다", () => {
    const ids = DUMMY_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("지문·보기에 빈 문자열이 없다", () => {
    for (const q of DUMMY_QUESTIONS) {
      expect(q.scenario.trim().length).toBeGreaterThan(0);
      for (const c of q.choices) expect(c.trim().length).toBeGreaterThan(0);
    }
  });

  it("pickQuestions 기본은 8개", () => {
    expect(pickQuestions()).toHaveLength(8);
  });

  it("pickQuestions(n)은 n개를 준다", () => {
    expect(pickQuestions(3)).toHaveLength(3);
  });

  it("중립 선택지는 보기 목록에 미리 섞여있지 않다 (본인 설문에서만 추가)", () => {
    for (const q of DUMMY_QUESTIONS) {
      expect(q.choices).not.toContain(NEUTRAL_CHOICE);
    }
  });
});
