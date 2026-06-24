import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SurveyQuestion } from "@/apis/survey/types";

import { SurveyRunner } from "./survey-runner";

// API 응답 모양의 로컬 fixture
const QS: SurveyQuestion[] = [
  {
    questionId: 1,
    sequence: 1,
    content: "질문 A",
    options: [
      { answerOptionId: 11, sequence: 1, content: "a1" },
      { answerOptionId: 12, sequence: 2, content: "a2" },
      { answerOptionId: 13, sequence: 3, content: "a3" },
      { answerOptionId: 14, sequence: 4, content: "a4" },
      { answerOptionId: 15, sequence: 5, content: "a5" },
    ],
  },
  {
    questionId: 2,
    sequence: 2,
    content: "질문 B",
    options: [
      { answerOptionId: 21, sequence: 1, content: "b1" },
      { answerOptionId: 22, sequence: 2, content: "b2" },
      { answerOptionId: 23, sequence: 3, content: "b3" },
      { answerOptionId: 24, sequence: 4, content: "b4" },
      { answerOptionId: 25, sequence: 5, content: "b5" },
    ],
  },
];

describe("SurveyRunner", () => {
  // 진행 표시는 "1"(blue) + " / 2"(gray) 두 span으로 쪼개져 있어 textContent로 매칭
  const progress = (text: string) =>
    screen.getByText(
      (_, el) => el?.tagName === "P" && el.textContent === text,
    );

  it("첫 문항과 진행도(1/N)를 보여준다", () => {
    render(<SurveyRunner questions={QS} onComplete={vi.fn()} />);
    expect(screen.getByText("질문 A")).toBeInTheDocument();
    expect(progress("1 / 2")).toBeInTheDocument();
  });

  it("보기를 고르면 다음 문항으로 넘어간다", () => {
    render(<SurveyRunner questions={QS} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("a1"));
    expect(screen.getByText("질문 B")).toBeInTheDocument();
    expect(progress("2 / 2")).toBeInTheDocument();
  });

  it("마지막 문항 완료 시 onComplete에 {questionId, answerOptionId}[] 를 넘긴다", () => {
    const onComplete = vi.fn();
    render(<SurveyRunner questions={QS} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("a1")); // questionId=1, answerOptionId=11
    fireEvent.click(screen.getByText("b3")); // questionId=2, answerOptionId=23
    expect(onComplete).toHaveBeenCalledWith(
      expect.arrayContaining([
        { questionId: 1, answerOptionId: 11 },
        { questionId: 2, answerOptionId: 23 },
      ]),
    );
  });

  it("문항이 비면 빈 상태를 보여준다", () => {
    render(<SurveyRunner questions={[]} onComplete={vi.fn()} />);
    expect(screen.getByText("불러올 문항이 없어요")).toBeInTheDocument();
  });

  it("첫 문항에서 뒤로 누르면 onBack 호출", () => {
    const onBack = vi.fn();
    render(
      <SurveyRunner questions={QS} onComplete={vi.fn()} onBack={onBack} />,
    );
    fireEvent.click(screen.getByLabelText("이전 문항"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
