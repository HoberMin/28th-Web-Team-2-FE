import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // 같은 네트워크 모바일 기기에서 개발 서버 접근 허용 (192.168.x.x 대역)
  allowedDevOrigins: ["192.168.45.187"],
};

// PWA: Serwist (서비스워커 + 오프라인 캐싱 + Web Push 확장 여지). 개발 모드에선 비활성화.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
