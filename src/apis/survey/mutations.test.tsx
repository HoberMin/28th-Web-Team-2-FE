import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/apis/error";
import { surveyKeys } from "@/apis/survey/keys";
import type { AnswerEntry } from "@/apis/survey/types";

const post = vi.fn();
vi.mock("@/apis/http", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import {
  SELF_SUBMISSION_MUTATION_KEY,
  useCreateSurveyAPI,
  useStartSubmissionAPI,
  useSubmitAnswersAPI,
} from "./mutations";

// 설문 제출 경로 — 실패하면 사용자가 푼 8문항이 유실된다.
// 검증 대상: 엔드포인트·바디 모양, 성공 후 상태 캐시 무효화, 에러 전파.

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const ANSWERS: AnswerEntry[] = [
  { questionId: 1, answerOptionId: 11 },
  { questionId: 2, answerOptionId: 23 },
];

beforeEach(() => {
  post.mockReset();
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
});

describe("useCreateSurveyAPI", () => {
  it("userNickname 을 바디로 실어 surveys 를 만든다", async () => {
    post.mockResolvedValue({ surveyCode: "tok" });
    const { result } = renderHook(() => useCreateSurveyAPI(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ userNickname: "루키" });
    });

    expect(post).toHaveBeenCalledWith("/api/v1/surveys", {
      userNickname: "루키",
    });
  });

  it("ApiError 를 그대로 전파한다 (화면이 message 를 보여줄 수 있게)", async () => {
    post.mockRejectedValue(new ApiError(400, "닉네임이 너무 길어요"));
    const { result } = renderHook(() => useCreateSurveyAPI(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ userNickname: "x" }).catch(() => {});
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe("닉네임이 너무 길어요");
  });
});

describe("useStartSubmissionAPI", () => {
  it("바디 없이 submissions 를 시작한다 (서버가 SELF/PEER 판별)", async () => {
    post.mockResolvedValue({ submissionId: 1 });
    const { result } = renderHook(() => useStartSubmissionAPI(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ surveyCode: "tok" });
    });

    expect(post).toHaveBeenCalledWith("/api/v1/surveys/tok/submissions");
    // 두 번째 인자(바디)를 넘기지 않는다
    expect(post.mock.calls[0]).toHaveLength(1);
  });

  // StrictMode 재마운트 후 useMutationState 로 결과를 복구하는 데 쓰이는 키
  it("복구용 mutationKey 를 달고 실행된다", async () => {
    post.mockResolvedValue({ submissionId: 1 });
    const { result } = renderHook(() => useStartSubmissionAPI(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ surveyCode: "tok" });
    });

    const states = queryClient
      .getMutationCache()
      .findAll({ mutationKey: SELF_SUBMISSION_MUTATION_KEY });
    expect(states).toHaveLength(1);
    expect(states[0].state.data).toEqual({ submissionId: 1 });
  });
});

describe("useSubmitAnswersAPI", () => {
  it("answers 를 { answers } 바디로 감싸 제출한다", async () => {
    post.mockResolvedValue({ submissionStatus: "COMPLETED" });
    const { result } = renderHook(() => useSubmitAnswersAPI(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ submissionId: 7, answers: ANSWERS });
    });

    expect(post).toHaveBeenCalledWith("/api/v1/submissions/7", {
      answers: ANSWERS,
    });
  });

  // 제출 직후 상태를 다시 읽어야 응답 수·결과 전환이 화면에 반영된다
  it("surveyCode 를 주면 성공 후 상태 캐시를 무효화한다", async () => {
    post.mockResolvedValue({ submissionStatus: "COMPLETED" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSubmitAnswersAPI(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        submissionId: 7,
        answers: ANSWERS,
        surveyCode: "tok",
      });
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: surveyKeys.status("tok"),
    });
  });

  it("surveyCode 가 없으면 무효화하지 않는다", async () => {
    post.mockResolvedValue({ submissionStatus: "COMPLETED" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSubmitAnswersAPI(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ submissionId: 7, answers: ANSWERS });
    });

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("실패하면 무효화하지 않고 에러를 전파한다", async () => {
    post.mockRejectedValue(new ApiError(409, "이미 제출했어요"));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSubmitAnswersAPI(), { wrapper });

    await act(async () => {
      await result.current
        .mutateAsync({ submissionId: 7, answers: ANSWERS, surveyCode: "tok" })
        .catch(() => {});
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.status).toBe(409);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
