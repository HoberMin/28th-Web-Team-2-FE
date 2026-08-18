// 공유 안내 카드 내용(카피·에셋)과 슬라이드 배열.
// 캐러셀 로직과 분리해 둔다 — 카피·에셋 교체가 동작 코드를 건드리지 않게.
// 카피 톤은 domain.md §1 (긍정/중립, 사실과 어긋나지 않게).

export type ShareCard = {
  n: number; // 단계 번호(뱃지)
  src: string;
  /** 일러스트 원본 크기(next/image 비율 계산용) — 표시 폭은 카드 콘텐츠 폭에 w-full */
  width: number;
  height: number;
  text: string;
};

// 일러스트는 카드 콘텐츠 폭(p-6 제외 ≈ 268px)에 w-full로 꽉 채운다 = Figma 캐릭터 268 width.
// (높이는 비율대로 자동 — 에셋마다 미세하게 다름. 에셋 높이 통일은 디자이너 재출력 시 확정.)
export const CARDS: ShareCard[] = [
  {
    n: 1,
    src: "/assets/img_character_hamster_under.png",
    width: 1072,
    height: 615,
    text: "아래 버튼으로 내 링크를 꼭 복사해줘!",
  },
  {
    n: 2,
    src: "/assets/img_character_hamster_three.png",
    width: 1072,
    height: 615,
    text: "친구가 참여할 수 있게 링크를 보내줘!",
  },
  {
    n: 3,
    // ⚠️ 일러스트가 시계 캐릭터(hamster_clock)인데 24시간 대기가 폐기돼 그림과 문구가
    //    어긋난다 — 에셋 교체 여부는 디자이너 판단 필요.
    src: "/assets/img_character_hamster_clock.png",
    width: 1072,
    height: 638,
    text: "3명 이상 모이면 바로 내 링크로 와!",
  },
];

// 2·3번 카드는 슬라이드되어 들어올 때 마운트되므로, 진입 즉시 세 장 모두 미리 받아둔다.
export const PRELOAD_CARDS = CARDS.map(({ src, width, height }) => ({
  src,
  width,
  height,
}));

// 양끝 클론을 더한 슬라이드 배열: [카드3, 카드1, 카드2, 카드3, 카드1]
// → 어느 방향으로 넘겨도 끊김 없이 순환한다(무한 루프).
export const SLIDES: ShareCard[] = [
  CARDS[CARDS.length - 1],
  ...CARDS,
  CARDS[0],
];
/** 카드1의 슬라이드 인덱스 */
export const FIRST_REAL = 1;
/** 카드3의 슬라이드 인덱스 */
export const LAST_REAL = CARDS.length;
