import type { MetadataRoute } from "next";

// 색인 대상은 랜딩(루트) 1개뿐 — 토큰 URL(설문·공유·결과)은 추측 불가능해야 하고
// 검색 노출 = 개인 결과 유출이라 robots에서 차단한다 (domain.md §3, robots.ts allow: /$).
// 공개 마케팅 페이지가 생기면 여기 + robots allow에 함께 추가할 것.
const SITE_URL = "https://looky.my";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
