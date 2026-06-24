// ⚠️ 현재 비활성 (2026-06-24): next.config.ts 에서 Serwist 를 껐기 때문에 이 파일은
//   빌드되지 않는다(= public/sw.js 로 컴파일되지 않음). 배포되는 SW 는 public/sw.js(자폭).
//   향후 Web Push 구현 시, 아래 defaultCache(공격적 런타임 캐싱)는 빼고
//   push/notificationclick 핸들러 중심의 최소 SW 로 다시 작성해 Serwist 를 켤 것.
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Serwist가 빌드 시 주입하는 프리캐시 매니페스트
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // navigationPreload: Safari에서 preloadResponse가 깨지면 NetworkFirst가
  // 응답을 못 받아 "no-response" 에러가 난다. CSR 앱이라 이득도 없어 끈다.
  navigationPreload: false,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
