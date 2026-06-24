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
