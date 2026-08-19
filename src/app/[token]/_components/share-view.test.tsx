import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 공유 관리 뷰 — 핵심 루프의 중심 화면.
// 세 관심사가 얽혀 있다: 이탈 가드(back 가로채기) · 공유(복사/카카오) · 계측.
// 분리 전 동작을 고정한다.

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const track = vi.fn();
vi.mock("@/lib/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

const shareKakao = vi.fn();
vi.mock("@/lib/share", () => ({ shareKakao: (...a: unknown[]) => shareKakao(...a) }));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/components/ui/bg-cloud", () => ({ BgCloud: () => null }));

// 확인 모달 — open 일 때만 렌더하고 버튼으로 콜백을 발화
vi.mock("@/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    onOpenChange,
    onConfirm,
    title,
  }: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onConfirm: () => void;
    title: string;
  }) =>
    open ? (
      <div>
        <p>{title}</p>
        <button type="button" onClick={() => onOpenChange(false)}>
          머무르기
        </button>
        <button type="button" onClick={onConfirm}>
          나가기
        </button>
      </div>
    ) : null,
}));

import { ShareView } from "./share-view";

const SURVEY_CODE = "tok";
const MODAL_TITLE = "친구들 답변을 모으는 중이에요";

const renderView = (respondentCount = 0) =>
  render(<ShareView surveyCode={SURVEY_CODE} respondentCount={respondentCount} />);

/** 클립보드 스텁 — 성공/실패 */
function setClipboard(ok: boolean) {
  const writeText = ok
    ? vi.fn().mockResolvedValue(undefined)
    : vi.fn().mockRejectedValue(new Error("denied"));
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

/** userAgent 교체 (안드로이드 분기 확인용) */
function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: ua,
  });
}

const originalUA = navigator.userAgent;

describe("ShareView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setClipboard(true);
    setUserAgent("Mozilla/5.0 (iPhone)");
    shareKakao.mockResolvedValue("shared");
    vi.spyOn(window.history, "pushState");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setUserAgent(originalUA);
  });

  describe("계측", () => {
    it("진입 시 share_view 를 추적한다 — ★ 핵심 퍼널 분모", () => {
      renderView();
      expect(track).toHaveBeenCalledWith("share_view");
    });

    it("응답 수를 respondent_count_{n} 으로 추적한다", () => {
      renderView(2);
      expect(track).toHaveBeenCalledWith("respondent_count_2", { count: 2 });
    });

    // 폴링으로 같은 값이 반복 유입되므로 중복 발화하면 지표가 부풀려진다
    it("같은 응답 수는 다시 추적하지 않는다", () => {
      const { rerender } = renderView(1);
      rerender(<ShareView surveyCode={SURVEY_CODE} respondentCount={1} />);
      rerender(<ShareView surveyCode={SURVEY_CODE} respondentCount={1} />);
      expect(
        track.mock.calls.filter(([e]) => e === "respondent_count_1"),
      ).toHaveLength(1);
    });

    it("응답 수가 늘면 새 값으로 추적한다", () => {
      const { rerender } = renderView(1);
      rerender(<ShareView surveyCode={SURVEY_CODE} respondentCount={2} />);
      expect(track).toHaveBeenCalledWith("respondent_count_2", { count: 2 });
    });
  });

  describe("응답 수 표시", () => {
    it("현재 응답 수를 보여준다", () => {
      renderView(2);
      expect(screen.getByText(/지금까지 2명이 답했어요/)).toBeInTheDocument();
    });
  });

  describe("링크 복사", () => {
    it("현재 origin 기준 공유 링크를 복사하고 추적한다", async () => {
      const writeText = setClipboard(true);
      renderView();
      fireEvent.click(screen.getByLabelText("링크 복사"));

      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith(
          `${window.location.origin}/${SURVEY_CODE}`,
        ),
      );
      expect(track).toHaveBeenCalledWith("link_copy");
    });

    it("iOS 에서는 복사 완료 토스트를 띄운다", async () => {
      renderView();
      fireEvent.click(screen.getByLabelText("링크 복사"));
      expect(await screen.findByText("링크 복사 완료!")).toBeInTheDocument();
    });

    // 안드로이드는 OS 가 자체 복사 안내를 띄워 토스트가 겹친다
    it("안드로이드에서는 토스트를 띄우지 않는다", async () => {
      setUserAgent("Mozilla/5.0 (Linux; Android 13)");
      const writeText = setClipboard(true);
      renderView();
      fireEvent.click(screen.getByLabelText("링크 복사"));

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect(screen.queryByText("링크 복사 완료!")).not.toBeInTheDocument();
    });

    it("복사가 막히면 길게 눌러 복사하라고 안내한다", async () => {
      setClipboard(false);
      renderView();
      fireEvent.click(screen.getByLabelText("링크 복사"));
      expect(
        await screen.findByText("복사에 실패했어요. 링크를 길게 눌러 복사해주세요"),
      ).toBeInTheDocument();
    });
  });

  describe("카카오 공유", () => {
    it("공유 시트가 열리면 그에 맞는 토스트", async () => {
      shareKakao.mockResolvedValue("shared");
      renderView();
      fireEvent.click(screen.getByText("카카오톡 공유하기"));

      expect(track).toHaveBeenCalledWith("share_kakao_click");
      expect(await screen.findByText("카카오톡 공유를 열었어요")).toBeInTheDocument();
    });

    it("복사로 물러나면 복사 안내 토스트", async () => {
      shareKakao.mockResolvedValue("copied");
      renderView();
      fireEvent.click(screen.getByText("카카오톡 공유하기"));
      expect(await screen.findByText("링크를 복사했어요")).toBeInTheDocument();
    });

    it("공유 링크와 OG 이미지를 함께 넘긴다", async () => {
      renderView();
      fireEvent.click(screen.getByText("카카오톡 공유하기"));

      await waitFor(() => expect(shareKakao).toHaveBeenCalled());
      expect(shareKakao).toHaveBeenCalledWith(
        expect.objectContaining({
          link: `${window.location.origin}/${SURVEY_CODE}`,
          imageUrl: `${window.location.origin}/assets/og-image.png`,
        }),
      );
    });
  });

  // 주인공이 back 을 누르면 온보딩으로 돌아가 수집 중인 링크에서 이탈한다 → 가드
  describe("이탈 가드", () => {
    const popBack = () =>
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

    it("마운트 시 가드 엔트리를 쌓는다", () => {
      renderView();
      expect(window.history.pushState).toHaveBeenCalledWith(
        { lookyShareGuard: true },
        "",
      );
    });

    it("back 을 누르면 나가지 않고 확인 모달을 띄운다", () => {
      renderView();
      expect(screen.queryByText(MODAL_TITLE)).not.toBeInTheDocument();

      popBack();
      expect(screen.getByText(MODAL_TITLE)).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });

    it("머무르기를 고르면 모달이 닫히고 가드를 다시 쌓는다", () => {
      renderView();
      popBack();
      vi.mocked(window.history.pushState).mockClear();

      fireEvent.click(screen.getByText("머무르기"));
      expect(screen.queryByText(MODAL_TITLE)).not.toBeInTheDocument();
      // 다음 back 도 잡으려면 가드가 다시 필요하다
      expect(window.history.pushState).toHaveBeenCalledWith(
        { lookyShareGuard: true },
        "",
      );
    });

    it("나가기를 고르면 랜딩으로 이동한다", () => {
      renderView();
      popBack();
      fireEvent.click(screen.getByText("나가기"));
      expect(replace).toHaveBeenCalledWith("/");
    });

    it("나가는 중에는 back 이 다시 모달을 띄우지 않는다", () => {
      renderView();
      popBack();
      fireEvent.click(screen.getByText("나가기"));

      popBack();
      expect(screen.queryByText(MODAL_TITLE)).not.toBeInTheDocument();
    });
  });
});
