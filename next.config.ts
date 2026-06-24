import type { NextConfig } from "next";

// PWA/Serwist 비활성화 (2026-06-24):
//   defaultCache 런타임 캐싱 + skipWaiting/clientsClaim 의 SW takeover race가
//   재배포마다 _next/image·RSC 를 net::ERR_FAILED 로 터뜨려 PWA 자체를 걷어냄.
//   대신 public/sw.js 가 자폭 SW 로서 이미 배포된 옛 SW 를 청소한다.
//   → Web Push 를 실제로 구현할 때 캐싱 없는 최소 SW 로 다시 도입 (src/app/sw.ts 참고).
const nextConfig: NextConfig = {
  turbopack: {},
  // 같은 네트워크 모바일 기기에서 개발 서버 접근 허용 (192.168.x.x 대역)
  allowedDevOrigins: ["192.168.45.187"],
  async headers() {
    return [
      {
        // 자폭 SW 가 즉시 전파되도록 항상 재검증 (캐시된 옛 sw.js 로 지연되지 않게)
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
