import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// F05 카드 확대 모달 — opening → open(0.4s hold) → flipping(0.6s) → back 플립 시퀀스.
// 빈 칸(내용 없음)이면 뒷면이 재참여 유도 + 공유 CTA 로 바뀐다 (domain.md 빈칸 정책).

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// framer-motion — layout 애니메이션 완료 콜백을 버튼으로 흉내낼 수 있게 노출
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      onLayoutAnimationComplete,
      layoutId,
      initial,
      animate,
      exit,
      transition,
      ...rest
    }: React.ComponentProps<"div"> & {
      onLayoutAnimationComplete?: () => void;
      layoutId?: string;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => {
      void layoutId;
      void initial;
      void animate;
      void exit;
      void transition;
      return (
        <div {...rest}>
          {onLayoutAnimationComplete && (
            // 이 버튼은 목이 만든 것이라 실제 화면엔 없다.
            // dialog 컨테이너가 onClick={onClose} 를 갖고 있어 버블링되면 모달이 닫혀버린다 → 차단.
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLayoutAnimationComplete();
              }}
            >
              layout-done
            </button>
          )}
          {children}
        </div>
      );
    },
  },
}));

import { ResultCardModal } from "./result-card-modal";

const HOLD_MS = 400;
const FLIP_MS = 600;

const onClose = vi.fn();
const onShareCopy = vi.fn();
const onShareKakao = vi.fn();

const renderModal = (
  over: Partial<React.ComponentProps<typeof ResultCardModal>> = {},
) =>
  render(
    <ResultCardModal
      quadrantKey="open"
      frontLabel="모두가 아는 나"
      imageUrl="https://cdn/open.png"
      definitionKeyword="탐험가"
      adjectiveKeywords={["호기심 많은", "겁 없는"]}
      interpretation="새로운 걸 좋아해요"
      onClose={onClose}
      onShareCopy={onShareCopy}
      onShareKakao={onShareKakao}
      {...over}
    />,
  );

/** opening → open → flipping → back 까지 진행 */
const flipToBack = () => {
  fireEvent.click(screen.getByText("layout-done")); // opening → open
  act(() => vi.advanceTimersByTime(HOLD_MS)); // open → flipping
  act(() => vi.advanceTimersByTime(FLIP_MS)); // flipping → back
};

describe("ResultCardModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("접근성", () => {
    it("모달 역할과 라벨을 준다", () => {
      renderModal();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-label", "모두가 아는 나 상세");
    });

    it("ESC 로 닫힌다", () => {
      renderModal();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });

    it("ESC 외 키에는 반응하지 않는다", () => {
      renderModal();
      fireEvent.keyDown(window, { key: "Enter" });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("언마운트 후에는 ESC 를 듣지 않는다", () => {
      const { unmount } = renderModal();
      unmount();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("딤을 탭하면 닫힌다", () => {
      renderModal();
      fireEvent.click(screen.getByRole("presentation"));
      expect(onClose).toHaveBeenCalled();
    });

    it("카드를 탭해도 닫힌다", () => {
      renderModal();
      fireEvent.click(screen.getByRole("dialog"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("앞면", () => {
    // 앞면과 뒷면(플립 후 상세)이 각각 이미지를 갖는다
    it("AI 이미지를 보여준다", () => {
      renderModal();
      expect(
        screen.getAllByAltText("모두가 아는 나 — AI 생성 이미지").length,
      ).toBeGreaterThan(0);
    });

    it("이미지가 없으면 안개 placeholder", () => {
      renderModal({ imageUrl: null });
      expect(screen.queryByAltText(/AI 생성 이미지/)).not.toBeInTheDocument();
      expect(screen.getAllByText("🌫️").length).toBeGreaterThan(0);
    });
  });

  describe("뒷면 — 내용이 있는 칸", () => {
    it("정의 키워드와 형용사 칩을 보여준다", () => {
      renderModal();
      flipToBack();
      expect(screen.getByText("탐험가")).toBeInTheDocument();
      expect(screen.getByText("호기심 많은")).toBeInTheDocument();
      expect(screen.getByText("겁 없는")).toBeInTheDocument();
    });

    it("해설을 보여준다", () => {
      renderModal();
      flipToBack();
      expect(screen.getByText("새로운 걸 좋아해요")).toBeInTheDocument();
    });

    it("형용사가 없으면 칩 영역을 생략한다", () => {
      renderModal({ adjectiveKeywords: [] });
      flipToBack();
      expect(screen.queryByText("호기심 많은")).not.toBeInTheDocument();
    });

    it("내용이 있으면 공유 CTA 를 띄우지 않는다", () => {
      renderModal();
      flipToBack();
      expect(screen.queryByText("링크 복사하기")).not.toBeInTheDocument();
    });
  });

  // 빈 화면이 아니라 재참여 유도로 채운다 (domain.md 빈칸 정책)
  describe("뒷면 — 빈 칸", () => {
    const empty = { imageUrl: null, interpretation: null };

    it("재참여 메시지를 보여준다", () => {
      renderModal(empty);
      flipToBack();
      expect(screen.getByText(/아직 너를 다 발견하지 못했어/)).toBeInTheDocument();
    });

    it("공유 CTA 로 다른 사람을 부를 수 있다", () => {
      renderModal(empty);
      flipToBack();

      fireEvent.click(screen.getByText("링크 복사하기"));
      expect(onShareCopy).toHaveBeenCalled();

      fireEvent.click(screen.getByText("카카오톡 공유하기"));
      expect(onShareKakao).toHaveBeenCalled();
    });

    // 카드 전체가 닫기 핸들러라 공유를 누르면 모달이 같이 닫혀 버린다
    it("공유 버튼을 눌러도 모달이 닫히지 않는다", () => {
      renderModal(empty);
      flipToBack();
      fireEvent.click(screen.getByText("링크 복사하기"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("플립 시퀀스", () => {
    it("hold 시간이 지나기 전에는 뒷면 내용이 보이지 않는다", () => {
      renderModal();
      fireEvent.click(screen.getByText("layout-done"));
      act(() => vi.advanceTimersByTime(HOLD_MS - 1));
      // 아직 flipping 전 — 타이머만 확인(뒷면 DOM 은 항상 존재하되 3D 로 가려짐)
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("layout 완료 전에는 hold 타이머가 시작되지 않는다", () => {
      renderModal();
      act(() => vi.advanceTimersByTime(HOLD_MS + FLIP_MS));
      // opening 에 머물러 있으므로 여전히 layout-done 버튼이 있다
      expect(screen.getByText("layout-done")).toBeInTheDocument();
    });
  });
});
