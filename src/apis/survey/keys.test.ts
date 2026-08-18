import { describe, expect, it } from "vitest";

import { surveyKeys } from "./keys";

// queryKey 팩토리 — 인라인 배열 금지 규칙(api-patterns)의 근거가 되는 파일.
// 키 모양이 바뀌면 캐시 무효화가 조용히 빗나가므로 계약으로 고정한다.

describe("surveyKeys", () => {
  it("all 은 도메인 루트 키", () => {
    expect(surveyKeys.all).toEqual(["survey"]);
  });

  it("status 는 루트 아래에 붙는다 — all 로 일괄 무효화 가능", () => {
    expect(surveyKeys.status("tok")).toEqual(["survey", "status", "tok"]);
  });

  it("result 도 루트 아래에 붙는다", () => {
    expect(surveyKeys.result("tok")).toEqual(["survey", "result", "tok"]);
  });

  it("surveyCode 가 다르면 키가 다르다 — 링크별 캐시가 섞이지 않는다", () => {
    expect(surveyKeys.status("a")).not.toEqual(surveyKeys.status("b"));
    expect(surveyKeys.result("a")).not.toEqual(surveyKeys.result("b"));
  });

  it("같은 surveyCode 라도 status 와 result 는 다른 키", () => {
    expect(surveyKeys.status("tok")).not.toEqual(surveyKeys.result("tok"));
  });

  it("모든 키가 all 을 접두사로 갖는다 (prefix 무효화 전제)", () => {
    for (const key of [surveyKeys.status("tok"), surveyKeys.result("tok")]) {
      expect(key.slice(0, surveyKeys.all.length)).toEqual([...surveyKeys.all]);
    }
  });
});
