import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/apis/error";
import type { AnswerEntry, SubmissionStartedResponse } from "@/apis/survey/types";

// 자기 설문 페이지 — 온보딩 필수 선행 단계.
// 캐시 복구·StrictMode 복구·재시도·제출이 얽혀 있어 분리 전 동작을 고정한다.

const replace = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, back }) }));

const startSubmission = vi.fn();
const submitAnswers = vi.fn();
const startState = {
  isPending: false,
  data: undefined as SubmissionStartedResponse | undefined,
  isError: false,
  error: null as Error | null,
};
const submitState = { isPending: false };

vi.mock("@/apis/survey/mutations", () => ({
  SELF_SUBMISSION_MUTATION_KEY: ["selfSurveySubmission"],
  useStartSubmissionAPI: () => ({ mutate: startSubmission, ...startState }),
  useSubmitAnswersAPI: () => ({ mutate: submitAnswers, ...submitState }),
}));

let recovered: SubmissionStartedResponse[] = [];
vi.mock("@tanstack/react-query", () => ({
  useMutationState: () => recovered,
}));

const track = vi.fn();
vi.mock("@/lib/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

const session = { surveyCode: "tok" as string | undefined };
vi.mock("@/lib/local-session", () => ({
  readSession: () => (session.surveyCode ? { surveyCode: session.surveyCode } : null),
}));

const cache = { data: null as SubmissionStartedResponse | null, done: false };
const clearSelfSurveyCache = vi.fn();
const markSelfSurveyDone = vi.fn();
const saveSelfSurveyCache = vi.fn();
vi.mock("@/lib/self-survey-cache", () => ({
  readSelfSurveyCache: () => cache.data,
  saveSelfSurveyCache: (...a: unknown[]) => saveSelfSurveyCache(...a),
  clearSelfSurveyCache: () => clearSelfSurveyCache(),
  isSelfSurveyDone: () => cache.done,
  markSelfSurveyDone: (...a: unknown[]) => markSelfSurveyDone(...a),
}));

vi.mock("@/lib/preload-images", () => ({ usePreloadImages: () => {} }));

vi.mock("@/components/survey/survey-runner", () => ({
  SurveyRunner: ({
    questions,
    onComplete,
    onBack,
    onQuestionView,
  }: {
    questions: unknown[];
    onComplete: (a: AnswerEntry[]) => void;
    onBack?: () => void;
    onQuestionView?: (i: number, t: number) => void;
  }) => (
    <div>
      {`view:survey:${questions.length}`}
      <button type="button" onClick={() => onQuestionView?.(0, questions.length)}>
        q-view
      </button>
      <button type="button" onClick={onBack}>
        back
      </button>
      <button
        type="button"
        onClick={() => onComplete([{ questionId: 1, answerOptionId: 11 }])}
      >
        complete
      </button>
    </div>
  ),
}));

import SelfSurveyPage from "./page";

const DATA = {
  submissionId: 7,
  questions: [{ questionId: 1 }, { questionId: 2 }],
} as unknown as SubmissionStartedResponse;

const resetAll = () => {
  vi.clearAllMocks();
  startState.isPending = false;
  startState.data = undefined;
  startState.isError = false;
  startState.error = null;
  submitState.isPending = false;
  recovered = [];
  session.surveyCode = "tok";
  cache.data = null;
  cache.done = false;
};

describe("SelfSurveyPage", () => {
  beforeEach(resetAll);

  describe("진입", () => {
    it("세션이 있으면 문항을 요청한다", () => {
      render(<SelfSurveyPage />);
      expect(startSubmission).toHaveBeenCalledWith({ surveyCode: "tok" });
    });

    it("세션이 없으면 닉네임 화면으로 돌려보낸다", () => {
      session.surveyCode = undefined;
      render(<SelfSurveyPage />);
      expect(replace).toHaveBeenCalledWith("/onboarding/nickname");
      expect(startSubmission).not.toHaveBeenCalled();
    });

    // 결과에서 back 으로 설문에 재진입하면 재제출(409)이 난다
    it("이미 제출한 설문이면 결과로 보낸다", () => {
      cache.done = true;
      render(<SelfSurveyPage />);
      expect(replace).toHaveBeenCalledWith("/tok");
      expect(startSubmission).not.toHaveBeenCalled();
    });

    // 새로고침 시 POST 를 다시 쏘면 409 가 난다
    it("캐시가 있으면 API 를 호출하지 않고 그 문항을 쓴다", () => {
      cache.data = DATA;
      render(<SelfSurveyPage />);
      expect(startSubmission).not.toHaveBeenCalled();
      expect(screen.getByText("view:survey:2")).toBeInTheDocument();
    });
  });

  describe("문항 확보 경로", () => {
    it("API 응답으로 설문을 그린다", () => {
      startState.data = DATA;
      render(<SelfSurveyPage />);
      expect(screen.getByText("view:survey:2")).toBeInTheDocument();
    });

    // StrictMode 재마운트로 옵저버가 교체돼도 MutationCache 에서 복구된다
    it("StrictMode 복구 데이터로도 설문을 그린다", () => {
      recovered = [DATA];
      render(<SelfSurveyPage />);
      expect(screen.getByText("view:survey:2")).toBeInTheDocument();
    });

    it("응답이 오면 캐시에 저장한다", () => {
      startState.data = DATA;
      render(<SelfSurveyPage />);
      expect(saveSelfSurveyCache).toHaveBeenCalledWith("tok", DATA);
    });
  });

  describe("상태 3종", () => {
    it("문항을 받기 전에는 아무것도 렌더하지 않는다", () => {
      startState.isPending = true;
      const { container } = render(<SelfSurveyPage />);
      expect(container).toBeEmptyDOMElement();
    });

    it("실패하면 서버 메시지와 재시도 버튼", () => {
      startState.isError = true;
      startState.error = new ApiError(500, "서버가 아파요");
      render(<SelfSurveyPage />);
      expect(screen.getByText("서버가 아파요")).toBeInTheDocument();

      fireEvent.click(screen.getByText("다시 시도"));
      expect(startSubmission).toHaveBeenCalled();
    });

    it("ApiError 가 아니면 기본 문구", () => {
      startState.isError = true;
      startState.error = new Error("network");
      render(<SelfSurveyPage />);
      expect(
        screen.getByText("문항을 불러오지 못했어요. 다시 시도해주세요."),
      ).toBeInTheDocument();
    });

    // 성공했는데 문항이 0개면 설문을 진행할 수 없다
    it("문항이 비면 재시도 화면", () => {
      startState.data = { submissionId: 7, questions: [] } as unknown as SubmissionStartedResponse;
      render(<SelfSurveyPage />);
      expect(
        screen.getByText("문항을 불러오지 못했어요. 다시 시도해주세요."),
      ).toBeInTheDocument();
    });
  });

  describe("제출", () => {
    const renderWithData = () => {
      startState.data = DATA;
      return render(<SelfSurveyPage />);
    };

    it("submissionId 와 surveyCode 를 함께 넘긴다", () => {
      renderWithData();
      fireEvent.click(screen.getByText("complete"));
      expect(submitAnswers).toHaveBeenCalledWith(
        {
          submissionId: 7,
          answers: [{ questionId: 1, answerOptionId: 11 }],
          surveyCode: "tok",
        },
        expect.anything(),
      );
    });

    it("성공하면 캐시를 비우고 완료 표시 후 결과로 이동한다", () => {
      renderWithData();
      fireEvent.click(screen.getByText("complete"));
      act(() => {
        submitAnswers.mock.calls.at(-1)![1].onSuccess();
      });

      expect(track).toHaveBeenCalledWith("selfsurvey_complete");
      expect(clearSelfSurveyCache).toHaveBeenCalled();
      expect(markSelfSurveyDone).toHaveBeenCalledWith("tok");
      expect(replace).toHaveBeenCalledWith("/tok");
    });

    it("실패하면 메시지를 띄우고 이동하지 않는다", () => {
      renderWithData();
      fireEvent.click(screen.getByText("complete"));
      act(() => {
        submitAnswers.mock.calls.at(-1)![1].onError(new ApiError(409, "이미 제출했어요"));
      });

      expect(screen.getByText("이미 제출했어요")).toBeInTheDocument();
      expect(markSelfSurveyDone).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalledWith("/tok");
    });

    it("제출 중에는 아무것도 렌더하지 않는다", () => {
      submitState.isPending = true;
      startState.data = DATA;
      const { container } = render(<SelfSurveyPage />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("계측·내비게이션", () => {
    it("문항 노출을 selfsurvey_q{n} 으로 추적한다", () => {
      startState.data = DATA;
      render(<SelfSurveyPage />);
      fireEvent.click(screen.getByText("q-view"));
      expect(track).toHaveBeenCalledWith("selfsurvey_q1", {
        questionIndex: 1,
        total: 2,
      });
    });

    it("첫 문항에서 뒤로 누르면 히스토리 back", () => {
      startState.data = DATA;
      render(<SelfSurveyPage />);
      fireEvent.click(screen.getByText("back"));
      expect(back).toHaveBeenCalled();
    });
  });
});
