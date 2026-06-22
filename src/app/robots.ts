import type { MetadataRoute } from "next";

// 이 서비스는 URL이 곧 결과 열쇠다 — 토큰 URL(설문·공유·결과)은 추측 불가능해야 하고
// 검색 노출 = 개인 결과 유출 (domain.md §3). 그래서 기본은 "랜딩만 색인, 나머지 차단".
// 공개 마케팅 페이지가 생기면 allow에 명시적으로 추가할 것.
const SITE_URL = "https://looky.my";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/$", // 정확히 루트(랜딩)만 허용
      disallow: "/", // 나머지 전부 차단 (토큰 기반 개인 페이지 보호)
    },
    host: SITE_URL,
    // sitemap은 색인 대상이 랜딩 1개뿐이라 실익이 없어 생략 (domain.md §3)
  };
}
