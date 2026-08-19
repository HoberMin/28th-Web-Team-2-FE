import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/apis/error";
import type { SurveyQuestion } from "@/apis/survey/types";

// 참여자 설문 상태머신 — intro(2초 자동전환) → loading → survey → submitting → done / error.
// 분리 전 동작을 고정한다. SurveyRunner 는 자체 테스트가 있어 여기선 마커로 대체.

const startSubmission = vi.fn();
const submitAnswers = vi.fn();
vi.mock("@/apis/survey/mutations", () => ({
  useStartSubmissionAPI: () => ({ mutate: startSubmission }),
  useSubmitAnswersAPI: () => ({ mutate: submitAnswers }),
}));

const track = vi.fn();
vi.mock("@/lib/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

const markSurveyStarted = vi.fn();
const markSurveyDone = vi.fn();
vi.mock("@/lib/local-session", () => ({
  markSurveyStarted: (...a: unknown[]) => markSurveyStarted(...a),
  markSurveyDone: (...a: unknown[]) => markSurveyDone(...a),
}));

vi.mock("@/lib/preload-images", () => ({ usePreloadImages: () => {} }));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/components/layout/centered-screen", () => ({
  CenteredScreen: ({
    children,
    footer,
  }: {
    children?: React.ReactNode;
    footer?: React.ReactNode;
  }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}));

// 설문 러너는 완료 콜백만 흉내낸다
vi.mock("@/components/survey/survey-runner", () => ({
  SurveyRunner: ({
    questions,
    onComplete,
    onQuestionView,
  }: {
    questions: SurveyQuestion[];
    onComplete: (a: { questionId: number; answerOptionId: number }[]) => void;
    onQuestionView?: (index: number, total: number) => void;
  }) => (
    <div>
      {`view:survey:${questions.length}`}
      <button type="button" onClick={() => onQuestionView?.(0, questions.length)}>
        q-view
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

import { RespondentView } from "./respondent-view";

const INTRO_MS = 2000;
const QUESTIONS = [{ questionId: 1 }, { questionId: 2 }] as SurveyQuestion[];

const renderView = () =>
  render(<RespondentView surveyCode="tok" nickname="루키" />);

/** intro 자동 전환을 넘겨 startSubmission 이 호출되게 한다 */
const passIntro = () => act(() => vi.advanceTimersByTime(INTRO_MS));

/** startSubmission 의 onSuccess 를 발화 */
const resolveStart = (submissionId = 7) =>
  act(() => {
    const [, handlers] = startSubmission.mock.calls.at(-1)!;
    handlers.onSuccess({ submissionId, questions: QUESTIONS });
  });

describe("RespondentView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("진입", () => {
    it("설문 시작을 로컬에 표시하고 respond_view 를 추적한다", () => {
      renderView();
      // 상위 폴링이 결과로 바뀌어도 설문 도중 튕기지 않게 하는 가드의 근거
      expect(markSurveyStarted).toHaveBeenCalledWith("tok");
      expect(track).toHaveBeenCalledWith("respond_view");
    });

    it("intro 화면에 주인공 닉네임을 보여준다", () => {
      renderView();
      expect(screen.getByText(/루키님의 네컷이 완성돼요/)).toBeInTheDocument();
    });

    it("2초 전에는 문항을 요청하지 않는다", () => {
      renderView();
      act(() => vi.advanceTimersByTime(INTRO_MS - 1));
      expect(startSubmission).not.toHaveBeenCalled();
    });

    it("2초가 지나면 문항을 요청한다", () => {
      renderView();
      passIntro();
      expect(startSubmission).toHaveBeenCalledWith(
        { surveyCode: "tok" },
        expect.anything(),
      );
    });
  });

  describe("설문 진행", () => {
    it("문항을 받으면 설문 화면으로 넘어간다", () => {
      renderView();
      passIntro();
      resolveStart();
      expect(screen.getByText(`view:survey:${QUESTIONS.length}`)).toBeInTheDocument();
    });

    it("문항 노출을 respond_q{n} 으로 추적한다", () => {
      renderView();
      passIntro();
      resolveStart();
      fireEvent.click(screen.getByText("q-view"));
      expect(track).toHaveBeenCalledWith("respond_q1", {
        questionIndex: 1,
        total: QUESTIONS.length,
      });
    });

    it("완료하면 받은 submissionId 로 답변을 제출한다", () => {
      renderView();
      passIntro();
      resolveStart(42);
      fireEvent.click(screen.getByText("complete"));
      expect(submitAnswers).toHaveBeenCalledWith(
        { submissionId: 42, answers: [{ questionId: 1, answerOptionId: 11 }] },
        expect.anything(),
      );
    });
  });

  describe("제출 성공 → 완료", () => {
    const completeSurvey = () => {
      renderView();
      passIntro();
      resolveStart();
      fireEvent.click(screen.getByText("complete"));
      act(() => {
        const [, handlers] = submitAnswers.mock.calls.at(-1)!;
        handlers.onSuccess();
      });
    };

    it("respond_complete 추적 + 제출 완료를 로컬에 표시한다", () => {
      completeSurvey();
      expect(track).toHaveBeenCalledWith("respond_complete");
      // 결과에서 back 으로 재진입해 재제출(409)하는 것을 막는 표시
      expect(markSurveyDone).toHaveBeenCalledWith("tok");
    });

    it("완료 화면에서 바이럴 루프 CTA 를 보여준다", () => {
      completeSurvey();
      expect(screen.getByText("나도 만들기")).toBeInTheDocument();
      expect(screen.getByText("남이 본 내 모습이 궁금하다면?")).toBeInTheDocument();
    });
  });

  describe("에러 처리", () => {
    it("문항 로드 실패 시 서버 메시지를 보여준다", () => {
      renderView();
      passIntro();
      act(() => {
        const [, handlers] = startSubmission.mock.calls.at(-1)!;
        handlers.onError(new ApiError(500, "서버가 아파요"));
      });
      expect(screen.getByText("서버가 아파요")).toBeInTheDocument();
    });

    it("ApiError 가 아니면 기본 문구로 대체한다", () => {
      renderView();
      passIntro();
      act(() => {
        const [, handlers] = startSubmission.mock.calls.at(-1)!;
        handlers.onError(new Error("network"));
      });
      expect(
        screen.getByText("문항을 불러오지 못했어요. 다시 시도해주세요."),
      ).toBeInTheDocument();
    });

    it("제출 실패도 에러 화면으로 간다", () => {
      renderView();
      passIntro();
      resolveStart();
      fireEvent.click(screen.getByText("complete"));
      act(() => {
        const [, handlers] = submitAnswers.mock.calls.at(-1)!;
        handlers.onError(new ApiError(409, "이미 제출했어요"));
      });
      expect(screen.getByText("이미 제출했어요")).toBeInTheDocument();
      // 실패했으므로 완료 표시를 남기면 안 된다
      expect(markSurveyDone).not.toHaveBeenCalled();
    });

    it("다시 시도를 누르면 intro 부터 재시작한다", () => {
      renderView();
      passIntro();
      act(() => {
        const [, handlers] = startSubmission.mock.calls.at(-1)!;
        handlers.onError(new ApiError(500, "서버가 아파요"));
      });

      fireEvent.click(screen.getByText("다시 시도"));
      expect(screen.getByText(/루키님의 네컷이 완성돼요/)).toBeInTheDocument();

      passIntro();
      expect(startSubmission).toHaveBeenCalledTimes(2);
    });
  });
});
