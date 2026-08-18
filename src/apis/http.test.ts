import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/apis/error";

import { api } from "./http";

// 모든 API 호출이 지나가는 지점 — envelope 해제·에러 변환·바디 직렬화 규칙을 고정한다.
// BASE_URL은 모듈 로드 시점에 읽히므로 여기선 빈 문자열(테스트 환경 기본)로 가정한다.

const fetchMock = vi.fn();

/** 성공 envelope 응답 */
const ok = (payload: unknown, status = 200) =>
  new Response(JSON.stringify({ status: "success", message: "ok", payload }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** 실패 envelope 응답 */
const fail = (
  status: number,
  body?: unknown,
  statusText = "Error",
) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    statusText,
    headers: { "Content-Type": "application/json" },
  });

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init };
};

describe("api (fetch 래퍼)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("성공 응답", () => {
    it("envelope에서 payload만 꺼내 돌려준다", async () => {
      fetchMock.mockResolvedValue(ok({ id: 1, name: "루키" }));
      await expect(api.get("/surveys/tok")).resolves.toEqual({
        id: 1,
        name: "루키",
      });
    });

    it("204 No Content면 undefined를 돌려준다 (본문 파싱 안 함)", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await expect(api.delete("/surveys/tok")).resolves.toBeUndefined();
    });
  });

  describe("URL·쿼리 조립", () => {
    it("params를 쿼리스트링으로 붙인다", async () => {
      fetchMock.mockResolvedValue(ok(null));
      await api.get("/questions", { params: { count: 8, type: "SELF" } });
      expect(lastCall().url).toBe("/questions?count=8&type=SELF");
    });

    it("undefined·null인 param은 빼고 조립한다", async () => {
      fetchMock.mockResolvedValue(ok(null));
      await api.get("/questions", {
        params: { a: 1, b: undefined, c: null, d: false },
      });
      expect(lastCall().url).toBe("/questions?a=1&d=false");
    });

    it("남는 param이 없으면 ? 를 붙이지 않는다", async () => {
      fetchMock.mockResolvedValue(ok(null));
      await api.get("/questions", { params: { a: undefined } });
      expect(lastCall().url).toBe("/questions");
    });

    it("params가 없으면 경로만 쓴다", async () => {
      fetchMock.mockResolvedValue(ok(null));
      await api.get("/questions");
      expect(lastCall().url).toBe("/questions");
    });
  });

  describe("바디·헤더", () => {
    it("객체 바디는 JSON 직렬화하고 Content-Type을 붙인다", async () => {
      fetchMock.mockResolvedValue(ok(null));
      await api.post("/submissions", { answerOptionId: 11 });
      const { init } = lastCall();
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ answerOptionId: 11 }));
      expect(init.headers).toMatchObject({
        "Content-Type": "application/json",
      });
    });

    it("FormData 바디는 직렬화하지 않고 Content-Type도 붙이지 않는다", async () => {
      fetchMock.mockResolvedValue(ok(null));
      const form = new FormData();
      form.append("file", "x");
      await api.post("/upload", form);
      const { init } = lastCall();
      expect(init.body).toBe(form);
      expect(init.headers).not.toHaveProperty("Content-Type");
    });

    it("바디가 없으면 body를 undefined로 둔다", async () => {
      fetchMock.mockResolvedValue(ok(null));
      await api.post("/ping");
      expect(lastCall().init.body).toBeUndefined();
    });

    it("호출자가 준 헤더가 기본 헤더를 덮는다", async () => {
      fetchMock.mockResolvedValue(ok(null));
      await api.post("/x", { a: 1 }, { headers: { "Content-Type": "text/plain" } });
      expect(lastCall().init.headers).toMatchObject({
        "Content-Type": "text/plain",
      });
    });
  });

  describe("HTTP 메서드", () => {
    it.each([
      ["get", () => api.get("/x"), "GET"],
      ["post", () => api.post("/x"), "POST"],
      ["put", () => api.put("/x"), "PUT"],
      ["patch", () => api.patch("/x"), "PATCH"],
      ["delete", () => api.delete("/x"), "DELETE"],
    ] as const)("%s → %s", async (_name, call, method) => {
      fetchMock.mockResolvedValue(ok(null));
      await call();
      expect(lastCall().init.method).toBe(method);
    });
  });

  describe("에러 변환 (new Error 금지 · ApiError만)", () => {
    it("실패 envelope의 message·errorCode·errors를 ApiError로 옮긴다", async () => {
      fetchMock.mockResolvedValue(
        fail(400, {
          status: "fail",
          message: "닉네임이 너무 길어요",
          payload: {
            errorCode: "NICKNAME_TOO_LONG",
            errors: [{ field: "nickname", reason: "최대 10자" }],
          },
        }),
      );

      const error = await api.post("/surveys").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(400);
      expect(apiError.message).toBe("닉네임이 너무 길어요");
      expect(apiError.errorCode).toBe("NICKNAME_TOO_LONG");
      expect(apiError.fieldErrors).toEqual([
        { field: "nickname", reason: "최대 10자" },
      ]);
    });

    it("404는 isNotFound가 true (만료·없는 링크 분기의 근거)", async () => {
      fetchMock.mockResolvedValue(
        fail(404, { status: "fail", message: "없는 설문" }),
      );
      const error = (await api.get("/surveys/none").catch((e: unknown) => e)) as ApiError;
      expect(error.isNotFound).toBe(true);
      expect(error.isUnauthorized).toBe(false);
    });

    it("비-JSON 에러 바디면 status/statusText로 메시지를 만든다", async () => {
      fetchMock.mockResolvedValue(
        new Response("<html>502</html>", {
          status: 502,
          statusText: "Bad Gateway",
        }),
      );
      const error = (await api.get("/x").catch((e: unknown) => e)) as ApiError;
      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(502);
      expect(error.message).toBe("API 502 Bad Gateway");
      expect(error.errorCode).toBeUndefined();
    });

    it("errors 배열이 비어 있으면 fieldErrors를 채우지 않는다", async () => {
      fetchMock.mockResolvedValue(
        fail(400, {
          status: "fail",
          message: "잘못된 요청",
          payload: { errorCode: "BAD", errors: [] },
        }),
      );
      const error = (await api.get("/x").catch((e: unknown) => e)) as ApiError;
      expect(error.fieldErrors).toBeUndefined();
    });
  });
});
