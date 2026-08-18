// 공유 안내 캐러셀 수치 (Figma F04 리디자인 · node 832:13771).
// 캐러셀 상태 훅(use-share-carousel)과 카드 프레임(share-card-frame)이 함께 참조한다.

// ── 타이밍·인터랙션 ─────────────────────────────────────────────────────────
export const AUTOPLAY_MS = 2000; // 카드당 노출 2초
export const SLIDE_MS = 300; // 슬라이드 전환 시간
export const SWIPE_THRESHOLD = 50; // 스와이프 인정 거리(px)

// ── 지오메트리 ──────────────────────────────────────────────────────────────
// Figma 830:9452 기준: 풀폭 뷰포트(390)에서 활성 카드 316px(=81%), 좌우 peek ~21px.
// 캐러셀은 share-view에서 -mx-5로 화면 끝까지 펼쳐진다.
// 사이드 카드는 별도 px를 박지 않고 활성 카드 스펙에 transform: scale(0.8)만 적용한다
//   → 19.2/12.8/0.8px 같은 소수점 px가 발생하지 않아 토큰 정합성이 유지된다.
// scale 기준점은 "안쪽(활성 카드 쪽) 모서리"라서(share-card-frame transformOrigin)
// 카드를 넓게 둬도 peek이 사라지지 않는다.
export const GAP_PX = 16; // 카드 사이 간격 — 슬라이드 한 칸 이동량에 함께 반영
export const SIDE_SCALE = 0.8; // 좌우 비활성 카드 축소율
export const CARD_W_PCT = 81;
/** 활성 카드를 뷰포트 가운데로 보내는 절반 여백(%) */
export const SIDE_OFFSET_PCT = (100 - CARD_W_PCT) / 2;
