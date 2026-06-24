import { describe, expect, it } from "vitest";

import { ApiError, isApiError } from "@/apis/error";

describe("ApiError", () => {
  it("status·message를 보존한다", () => {
    const error = new ApiError(404, "없는 링크");
    expect(error.status).toBe(404);
    expect(error.message).toBe("없는 링크");
  });

  it("errorCode·fieldErrors를 보존한다", () => {
    const error = new ApiError(400, "입력 오류", "VALIDATION_FAIL", [
      { field: "userNickname", reason: "1~10자 이내여야 합니다" },
    ]);
    expect(error.errorCode).toBe("VALIDATION_FAIL");
    expect(error.fieldErrors).toEqual([
      { field: "userNickname", reason: "1~10자 이내여야 합니다" },
    ]);
  });

  it("isUnauthorized·isNotFound getter가 동작한다", () => {
    expect(new ApiError(401, "Unauthorized").isUnauthorized).toBe(true);
    expect(new ApiError(404, "Not Found").isNotFound).toBe(true);
    expect(new ApiError(500, "Internal Server Error").isUnauthorized).toBe(false);
  });

  it("isApiError 타입 가드로 분기된다", () => {
    expect(isApiError(new ApiError(500, "Internal Server Error"))).toBe(true);
    expect(isApiError(new Error("plain"))).toBe(false);
  });
});
