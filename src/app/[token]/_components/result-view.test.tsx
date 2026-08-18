import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/apis/error";
import { QUADRANT_LABEL } from "@data/quadrants";
import type { QuadrantKey } from "@data/quadrants";

// 분리 리팩토링 전 안전망 (characterization).
// 대상: phase 상태머신(gate → loading → body) · 상태 3종 · 공유 로직 · 빈 칸 처리.
// 자식 뷰(ResultLoading/ResultCardModal/ResultTapHint)는 마커로 대체 — 여기 관심사가 아니다.

const useGetSurveyResultAPI = vi.fn();
vi.mock("@/apis/survey/queries", () => ({
  useGetSurveyResultAPI: (...args: unknown[]) => useGetSurveyResultAPI(...args),
}));

const track = vi.fn();
vi.mock("@/lib/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

const shareKakao = vi.fn();
vi.mock("@/lib/share", () => ({
  shareKakao: (...a: unknown[]) => shareKakao(...a),
}));

const usePreloadImages = vi.fn();
vi.mock("@/lib/preload-images", () => ({
  usePreloadImages: (...a: unknown[]) => usePreloadImages(...a),
}));

// next/image → 평범한 img. fill/priority 등 next 전용 prop은 DOM에 흘리지 않는다.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// framer-motion → 애니메이션 없는 통과 래퍼.
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  motion: {
    button: ({
      children,
      layoutId,
      ...rest
    }: React.ComponentProps<"button"> & { layoutId?: string }) => {
      // layoutId는 framer-motion 전용 prop — DOM에 흘리지 않는다
      void layoutId;
      return <button {...rest}>{children}</button>;
    },
  },
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

vi.mock("./result-loading", () => ({
  ResultLoading: ({ onDone }: { onDone: () => void }) => (
    <div>
      view:loading
      <button type="button" onClick={onDone}>
        loading-done
      </button>
    </div>
  ),
}));

vi.mock("./result-tap-hint", () => ({
  ResultTapHint: ({ onDismiss }: { onDismiss: () => void }) => (
    <div>
      view:hint
      <button type="button" onClick={onDismiss}>
        hint-dismiss
      </button>
    </div>
  ),
}));

vi.mock("./result-card-modal", () => ({
  ResultCardModal: ({
    frontLabel,
    onClose,
  }: {
    frontLabel: string;
    onClose: () => void;
  }) => (
    <div>
      {`view:modal:${frontLabel}`}
      <button type="button" onClick={onClose}>
        modal-close
      </button>
    </div>
  ),
}));

import { ResultView } from "./result-view";

const QUADRANT_DATA = {
  definitionKeyword: "탐험가",
  adjectiveKeywords: ["호기심 많은"],
  interpretation: "새로운 걸 좋아해요",
  imageUrl: "https://cdn.test/open.png",
};

/** quadrants 전체가 채워진 READY 결과 */
const readyData = (over: Record<string, unknown> = {}) => ({
  overallKeyword: "마음을 잘 여는",
  quadrants: {
    open: QUADRANT_DATA,
    blind: { ...QUADRANT_DATA, imageUrl: "https://cdn.test/blind.png" },
    hidden: { ...QUADRANT_DATA, imageUrl: "https://cdn.test/hidden.png" },
    unknown: { ...QUADRANT_DATA, imageUrl: "https://cdn.test/unknown.png" },
  },
  ...over,
});

const givenResult = (
  data: unknown,
  over: { isLoading?: boolean; error?: Error | null; refetch?: () => void } = {},
) => {
  useGetSurveyResultAPI.mockReturnValue({
    data,
    isLoading: over.isLoading ?? false,
    error: over.error ?? null,
    refetch: over.refetch ?? vi.fn(),
  });
};

const renderView = (props: Partial<React.ComponentProps<typeof ResultView>> = {}) =>
  render(
    <ResultView
      surveyCode="tok"
      nickname="루키"
      respondentCount={3}
      resultAvailableAt="2026-08-18T09:00:00Z"
      {...props}
    />,
  );

/** gate → loading → body 까지 진행시킨다 */
const enterBody = () => {
  fireEvent.click(screen.getByText("내 네컷 결과 보기"));
  fireEvent.click(screen.getByText("loading-done"));
};

describe("ResultView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("상태 3종", () => {
    it("조회 중이면 로딩 화면", () => {
      givenResult(undefined, { isLoading: true });
      renderView();
      expect(screen.getByText("결과를 불러오고 있어요")).toBeInTheDocument();
    });

    it("에러면 메시지와 재시도 버튼", () => {
      const refetch = vi.fn();
      givenResult(undefined, { error: new ApiError(500, "서버 오류"), refetch });
      renderView();
      expect(screen.getByText("결과를 불러오지 못했어요")).toBeInTheDocument();
      expect(screen.getByText("서버 오류")).toBeInTheDocument();
      fireEvent.click(screen.getByText("다시 시도"));
      expect(refetch).toHaveBeenCalledOnce();
    });

    it("데이터는 왔지만 quadrants가 없으면 생성 대기 화면", () => {
      givenResult({ quadrants: null });
      renderView();
      expect(screen.getByText("네컷을 만들고 있어요")).toBeInTheDocument();
    });
  });

  describe("폴링 정책", () => {
    const interval = (data: unknown) => {
      givenResult(readyData());
      renderView();
      const options = useGetSurveyResultAPI.mock.calls[0][1] as {
        refetchInterval: (q: { state: { data?: unknown } }) => number | false;
      };
      return options.refetchInterval({ state: { data } });
    };

    it("quadrants가 준비되면 폴링을 멈춘다", () => {
      expect(interval(readyData())).toBe(false);
    });

    it("아직 준비되지 않았으면 3초마다 재조회", () => {
      expect(interval({ quadrants: null })).toBe(3000);
    });
  });

  describe("phase 상태머신", () => {
    beforeEach(() => givenResult(readyData()));

    it("처음엔 게이트 화면 — 닉네임과 응답 수를 보여준다", () => {
      renderView();
      expect(screen.getByText("루키")).toBeInTheDocument();
      expect(screen.getByText("친구 3명의 응답을 보러 갈까요?")).toBeInTheDocument();
      expect(screen.getByText("내 네컷 결과 보기")).toBeInTheDocument();
    });

    it("게이트 CTA를 누르면 로딩 연출로 넘어간다", () => {
      renderView();
      fireEvent.click(screen.getByText("내 네컷 결과 보기"));
      expect(screen.getByText("view:loading")).toBeInTheDocument();
    });

    it("로딩 연출이 끝나면 본문으로 넘어간다", () => {
      renderView();
      enterBody();
      expect(screen.getByText("마음을 잘 여는 루키")).toBeInTheDocument();
    });

    it("본문 도달 시에만 result_view를 추적한다", () => {
      renderView();
      expect(track).not.toHaveBeenCalledWith("result_view");
      enterBody();
      expect(track).toHaveBeenCalledWith("result_view");
    });
  });

  describe("본문 — 4cuts 그리드", () => {
    it("4칸 전부를 라벨과 함께 렌더한다", () => {
      givenResult(readyData());
      renderView();
      enterBody();
      for (const key of ["open", "blind", "hidden", "unknown"] as QuadrantKey[]) {
        expect(
          screen.getByLabelText(`${QUADRANT_LABEL[key]} 자세히 보기`),
        ).toBeInTheDocument();
      }
    });

    it("결과 날짜와 종합 키워드를 캡션에 보여준다", () => {
      givenResult(readyData());
      renderView();
      enterBody();
      expect(screen.getByText("마음을 잘 여는 루키")).toBeInTheDocument();
    });

    it("종합 키워드가 없으면 캡션을 생략한다", () => {
      givenResult(readyData({ overallKeyword: null }));
      renderView();
      enterBody();
      expect(screen.queryByText(/루키$/)).not.toBeInTheDocument();
    });

    it("빈 칸(imageUrl 없음)은 이미지 대신 placeholder를 둔다", () => {
      givenResult(
        readyData({
          quadrants: {
            open: QUADRANT_DATA,
            blind: QUADRANT_DATA,
            hidden: QUADRANT_DATA,
            unknown: { ...QUADRANT_DATA, imageUrl: null },
          },
        }),
      );
      renderView();
      enterBody();
      // AI 이미지는 3장만 — 빈 칸은 img를 만들지 않는다
      expect(screen.getAllByAltText(/AI 생성 이미지$/)).toHaveLength(3);
    });

    it("칸을 누르면 확대 모달이 열리고 닫을 수 있다", () => {
      givenResult(readyData());
      renderView();
      enterBody();
      fireEvent.click(screen.getByLabelText(`${QUADRANT_LABEL.blind} 자세히 보기`));
      expect(
        screen.getByText(`view:modal:${QUADRANT_LABEL.blind}`),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByText("modal-close"));
      expect(screen.queryByText(/^view:modal/)).not.toBeInTheDocument();
    });
  });

  describe("본문 — 공유", () => {
    beforeEach(() => givenResult(readyData()));

    it("링크 복사 성공 시 토스트를 띄우고 추적한다", async () => {
      renderView();
      enterBody();
      fireEvent.click(screen.getByText("링크 복사하기"));
      expect(track).toHaveBeenCalledWith("result_reshare_click", { method: "copy" });
      expect(await screen.findByText("링크 복사 완료!")).toBeInTheDocument();
    });

    it("클립보드가 막히면 안내 토스트로 대체한다", async () => {
      vi.stubGlobal("navigator", {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      });
      renderView();
      enterBody();
      fireEvent.click(screen.getByText("링크 복사하기"));
      expect(
        await screen.findByText(
          "복사에 실패했어요. 링크를 길게 눌러 복사해주세요",
        ),
      ).toBeInTheDocument();
    });

    it("카카오 공유 시트가 열리면 토스트를 띄우지 않는다", async () => {
      shareKakao.mockResolvedValue("shared");
      renderView();
      enterBody();
      fireEvent.click(screen.getByText("카카오톡 공유하기"));
      await waitFor(() => expect(shareKakao).toHaveBeenCalled());
      expect(track).toHaveBeenCalledWith("result_reshare_click", { method: "kakao" });
      expect(screen.queryByText("링크 복사 완료!")).not.toBeInTheDocument();
    });

    it("카카오가 복사로 fallback되면 토스트를 띄운다", async () => {
      shareKakao.mockResolvedValue("copied");
      renderView();
      enterBody();
      fireEvent.click(screen.getByText("카카오톡 공유하기"));
      expect(await screen.findByText("링크 복사 완료!")).toBeInTheDocument();
    });
  });

  // 힌트는 body 진입 1초 후 1회성으로 뜬다 → fake timer로 그 경계를 확정적으로 넘긴다.
  describe("본문 — 탭 힌트", () => {
    const HINT_DELAY_MS = 1000;

    beforeEach(() => {
      givenResult(readyData());
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("1초가 지나기 전에는 힌트가 없다", () => {
      renderView();
      enterBody();
      act(() => {
        vi.advanceTimersByTime(HINT_DELAY_MS - 1);
      });
      expect(screen.queryByText("view:hint")).not.toBeInTheDocument();
    });

    it("1초가 지나면 힌트가 뜨고, 닫으면 사라진다", () => {
      renderView();
      enterBody();
      act(() => {
        vi.advanceTimersByTime(HINT_DELAY_MS);
      });
      expect(screen.getByText("view:hint")).toBeInTheDocument();

      fireEvent.click(screen.getByText("hint-dismiss"));
      expect(screen.queryByText("view:hint")).not.toBeInTheDocument();
    });

    it("한 번 닫힌 힌트는 다시 뜨지 않는다 (1회성)", () => {
      renderView();
      enterBody();
      act(() => {
        vi.advanceTimersByTime(HINT_DELAY_MS);
      });
      fireEvent.click(screen.getByText("hint-dismiss"));

      act(() => {
        vi.advanceTimersByTime(HINT_DELAY_MS * 5);
      });
      expect(screen.queryByText("view:hint")).not.toBeInTheDocument();
    });
  });
});
