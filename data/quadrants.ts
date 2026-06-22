// 조하리의 창 4칸 — 용어 단일 진실 소스 (화면·문서 전부 이 라벨로 통일).
// 매핑: open=① 공개(본인∩친구) · blind=② 친구만 · hidden=③ 나만 · unknown=④ 아직 아무도.
// 라벨 톤: 긍정/중립만 (domain.md §1). 화면 간 드리프트 방지를 위해 여기서만 정의.

export type QuadrantKey = "open" | "blind" | "hidden" | "unknown";

export interface QuadrantMeta {
  key: QuadrantKey;
  label: string;
}

export const QUADRANTS: QuadrantMeta[] = [
  { key: "open", label: "모두가 아는 나" },
  { key: "blind", label: "친구만 아는 나" },
  { key: "hidden", label: "나만 아는 나" },
  { key: "unknown", label: "아직 모르는 나" },
];

export const QUADRANT_LABEL: Record<QuadrantKey, string> = {
  open: "모두가 아는 나",
  blind: "친구만 아는 나",
  hidden: "나만 아는 나",
  unknown: "아직 모르는 나",
};
