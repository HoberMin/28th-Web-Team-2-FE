import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/apis/error";
import type { ResultStatus, SurveyStatus, SurveyStatusResponse } from "@/apis/survey/types";

// 이 테스트의 대상은 "단일 URL 상태머신"의 분기 규칙뿐이다 (domain.md §3).
// 자식 뷰는 마커로 대체해 어느 뷰가 선택됐는지만 검증한다 — 뷰 내부 렌더는 각 뷰의 관심사.

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ token: "tok" }),
  useRouter: () => ({ push }),
}));

const useGetSurveyStatusAPI = vi.fn();
vi.mock("@/apis/survey/queries", () => ({
  useGetSurveyStatusAPI: (...args: unknown[]) => useGetSurveyStatusAPI(...args),
}));

const session = { isOwner: false, isSurveyStarted: false, isSurveyDone: false };
vi.mock("@/lib/local-session", () => ({
  isOwner: () => session.isOwner,
  isSurveyStarted: () => session.isSurveyStarted,
  isSurveyDone: () => session.isSurveyDone,
}));

// vi.mock 팩토리는 파일 최상단으로 호이스팅되므로 외부 변수를 참조할 수 없다 → 인라인.
vi.mock("./_components/expired-view", () => ({
  ExpiredView: () => <div>view:expired</div>,
}));
vi.mock("./_components/generating-view", () => ({
  GeneratingView: () => <div>view:generating</div>,
}));
vi.mock("./_components/result-view", () => ({
  ResultView: () => <div>view:result</div>,
}));
vi.mock("./_components/respondent-view", () => ({
  RespondentView: () => <div>view:respondent</div>,
}));
vi.mock("./_components/retry-view", () => ({
  RetryView: () => <div>view:retry</div>,
}));
vi.mock("./_components/share-view", () => ({
  ShareView: () => <div>view:share</div>,
}));

import TokenPage from "./page";

const STATUS: SurveyStatusResponse = {
  surveyCode: "tok",
  userNickname: "루키",
  surveyStatus: "COLLECTING",
  resultStatus: "COLLECTING_PEER_RESPONSES",
  generationPhase: null,
  selfSubmitted: true,
  peerSubmissionCount: 1,
  requiredPeerSubmissionCount: 3,
  resultAvailableAt: "2026-08-18T00:00:00Z",
  remainingSecondsToResultOpen: 0,
  shareUrl: "https://looky.my/tok",
  resultUrl: "https://looky.my/tok",
};

/** 상태 조회가 성공한 상황을 만든다 */
const givenStatus = (over: Partial<SurveyStatusResponse> = {}) => {
  useGetSurveyStatusAPI.mockReturnValue({
    data: { ...STATUS, ...over },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
};

const shownView = () => screen.getByText(/^view:/).textContent;

describe("TokenPage 상태머신", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.isOwner = false;
    session.isSurveyStarted = false;
    session.isSurveyDone = false;
  });

  describe("로딩 / 에러 / 빈 상태 3종", () => {
    it("조회 중에는 아무것도 렌더하지 않는다", () => {
      useGetSurveyStatusAPI.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });
      const { container } = render(<TokenPage />);
      expect(container).toBeEmptyDOMElement();
    });

    it("404면 만료 뷰를 보여준다", () => {
      useGetSurveyStatusAPI.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new ApiError(404, "없는 링크"),
        refetch: vi.fn(),
      });
      render(<TokenPage />);
      expect(shownView()).toBe("view:expired");
    });

    it("404가 아닌 에러는 재시도 가능한 에러 화면을 보여준다", () => {
      const refetch = vi.fn();
      useGetSurveyStatusAPI.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new ApiError(500, "서버 오류"),
        refetch,
      });
      render(<TokenPage />);
      expect(screen.getByText("잠시 문제가 생겼어요")).toBeInTheDocument();
      expect(screen.getByText("서버 오류")).toBeInTheDocument();

      fireEvent.click(screen.getByText("다시 시도"));
      expect(refetch).toHaveBeenCalledOnce();
    });

    it("에러도 없고 데이터도 없으면(방어) 만료 뷰", () => {
      useGetSurveyStatusAPI.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
      render(<TokenPage />);
      expect(shownView()).toBe("view:expired");
    });
  });

  describe("resultStatus 분기", () => {
    it("READY면 결과 뷰", () => {
      givenStatus({ resultStatus: "READY" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:result");
    });

    it("GENERATING이면 생성 중 뷰", () => {
      givenStatus({ resultStatus: "GENERATING", generationPhase: "IMAGE_GENERATING" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:generating");
    });

    it("FAILED면 재시도 뷰 (응답 미달이 아니라 생성 실패에서만)", () => {
      givenStatus({ resultStatus: "FAILED" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:retry");
    });

    it("resultStatus EXPIRED면 만료 뷰", () => {
      givenStatus({ resultStatus: "EXPIRED" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:expired");
    });

    it("surveyStatus EXPIRED면 만료 뷰", () => {
      givenStatus({ surveyStatus: "EXPIRED" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:expired");
    });
  });

  describe("수집 중 — 역할에 따른 분기", () => {
    const collecting: ResultStatus[] = [
      "WAITING_SELF_RESPONSE",
      "COLLECTING_PEER_RESPONSES",
      "WAITING_RESULT_OPEN_TIME",
    ];

    it.each(collecting)("주인공이면 %s 상태에서 공유 뷰", (resultStatus) => {
      session.isOwner = true;
      givenStatus({ resultStatus });
      render(<TokenPage />);
      expect(shownView()).toBe("view:share");
    });

    it.each(collecting)("참여자면 %s 상태에서 설문 뷰", (resultStatus) => {
      givenStatus({ resultStatus });
      render(<TokenPage />);
      expect(shownView()).toBe("view:respondent");
    });
  });

  // 이 가드가 깨지면 참여자가 설문을 풀던 중 폴링 결과로 화면이 튄다.
  describe("참여자 설문 진행 중 가드 (respondentInProgress)", () => {
    beforeEach(() => {
      session.isOwner = false;
      session.isSurveyStarted = true;
      session.isSurveyDone = false;
    });

    it("설문 진행 중이면 READY가 떠도 설문 뷰를 유지한다", () => {
      givenStatus({ resultStatus: "READY" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:respondent");
    });

    it("설문 진행 중이면 GENERATING이 떠도 설문 뷰를 유지한다", () => {
      givenStatus({ resultStatus: "GENERATING" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:respondent");
    });

    it("제출을 마친 참여자는 READY에서 결과 뷰로 넘어간다", () => {
      session.isSurveyDone = true;
      givenStatus({ resultStatus: "READY" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:result");
    });

    it("설문을 시작하지 않은 첫 방문자는 READY면 바로 결과 뷰", () => {
      session.isSurveyStarted = false;
      givenStatus({ resultStatus: "READY" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:result");
    });

    // 진행 중 가드는 EXPIRED/FAILED보다 약하다 — 만료·실패는 설문을 계속할 수 없다.
    it("진행 중이어도 FAILED면 재시도 뷰", () => {
      givenStatus({ resultStatus: "FAILED" });
      render(<TokenPage />);
      expect(shownView()).toBe("view:retry");
    });

    it("진행 중이어도 만료면 만료 뷰", () => {
      const surveyStatus: SurveyStatus = "EXPIRED";
      givenStatus({ surveyStatus });
      render(<TokenPage />);
      expect(shownView()).toBe("view:expired");
    });
  });

  describe("폴링 간격 정책", () => {
    const intervalFor = (data: SurveyStatusResponse | undefined) => {
      givenStatus();
      render(<TokenPage />);
      const options = useGetSurveyStatusAPI.mock.calls[0][1] as {
        refetchInterval: (q: { state: { data?: SurveyStatusResponse } }) => number | false;
      };
      return options.refetchInterval({ state: { data } });
    };

    it("데이터가 없으면 15초", () => {
      expect(intervalFor(undefined)).toBe(15000);
    });

    it("GENERATING은 체감이 중요해 3초", () => {
      expect(intervalFor({ ...STATUS, resultStatus: "GENERATING" })).toBe(3000);
    });

    it("수집 중은 15초", () => {
      expect(intervalFor({ ...STATUS, resultStatus: "COLLECTING_PEER_RESPONSES" })).toBe(15000);
    });

    it.each<ResultStatus>(["READY", "FAILED", "EXPIRED"])(
      "터미널 상태(%s)면 폴링을 멈춘다",
      (resultStatus) => {
        expect(intervalFor({ ...STATUS, resultStatus })).toBe(false);
      },
    );
  });
});
