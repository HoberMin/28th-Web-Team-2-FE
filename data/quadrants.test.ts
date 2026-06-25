import { describe, expect, it } from "vitest";

import { QUADRANT_LABEL, QUADRANTS, type QuadrantKey } from "./quadrants";

// 조하리 4칸 — 용어 통일이 깨지지 않게 고정. (라벨 드리프트 회귀 방지)
describe("조하리 4칸 단일 소스", () => {
  it("키 4개가 순서대로 open/blind/hidden/unknown", () => {
    expect(QUADRANTS.map((q) => q.key)).toEqual([
      "open",
      "blind",
      "hidden",
      "unknown",
    ]);
  });

  it("통일된 라벨을 쓴다", () => {
    expect(QUADRANTS.map((q) => q.label)).toEqual([
      "모두가 아는 나",
      "친구만 아는 나",
      "나만 아는 나",
      "아무도 모르는 나",
    ]);
  });

  it("④ unknown은 '아무도 모르는 나' — 폐기된 표현을 쓰지 않는다", () => {
    expect(QUADRANT_LABEL.unknown).toBe("아무도 모르는 나");
    const labels = Object.values(QUADRANT_LABEL);
    expect(labels).not.toContain("나의 숨겨진 모습");
    expect(labels).not.toContain("새롭게 발견될 나");
    expect(labels).not.toContain("공개된 나");
  });

  it("QUADRANT_LABEL과 QUADRANTS 라벨이 일치", () => {
    for (const q of QUADRANTS) {
      expect(QUADRANT_LABEL[q.key]).toBe(q.label);
    }
  });

  it("라벨은 서로 중복되지 않는다", () => {
    const labels = QUADRANTS.map((q) => q.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("키 타입 매핑이 빠짐없다", () => {
    const keys: QuadrantKey[] = ["open", "blind", "hidden", "unknown"];
    for (const k of keys) expect(QUADRANT_LABEL[k]).toBeTruthy();
  });
});
