import { describe, expect, it } from "vitest";

import { formatResultDate } from "./format-date";

describe("formatResultDate", () => {
  it("ISO 문자열을 'YYYY. MM. DD' 로 바꾼다", () => {
    // 로컬 타임존 의존을 피하려고 자정이 아닌 시각을 쓴다
    const d = new Date(2026, 7, 18, 12, 0, 0);
    expect(formatResultDate(d.toISOString())).toBe("2026. 08. 18");
  });

  it("월·일을 2자리로 채운다", () => {
    const d = new Date(2026, 0, 5, 12, 0, 0);
    expect(formatResultDate(d.toISOString())).toBe("2026. 01. 05");
  });

  it("파싱할 수 없는 값은 빈 문자열 (호출부가 캡션을 생략한다)", () => {
    expect(formatResultDate("어제")).toBe("");
    expect(formatResultDate("")).toBe("");
  });
});
