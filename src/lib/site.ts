// 사이트 절대 URL — 단일 진실 소스.
//
// layout(metadataBase) · sitemap · robots 세 곳이 각자 같은 문자열을 들고 있어
// 하나만 바꾸면 OG 링크나 robots 의 sitemap 경로가 조용히 어긋났다.
//
// NEXT_PUBLIC_SITE_URL 로 덮어쓸 수 있게 열어둔다 — 프리뷰·스테이징 배포에서
// 운영 도메인이 박힌 OG/canonical 이 나가는 것을 막기 위함. 미설정이면 운영 도메인.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://looky.my";
