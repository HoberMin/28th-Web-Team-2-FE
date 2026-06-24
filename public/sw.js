// looky — 자폭(self-destroying) 서비스워커.
//
// 왜 있나:
//   @serwist/next의 defaultCache(모든 네비게이션·RSC·_next/image를 런타임 캐싱) +
//   skipWaiting/clientsClaim 조합이, 재배포 때마다 SW takeover race를 일으켜
//   _next/image·RSC 요청이 net::ERR_FAILED로 "한 번 터졌다 리로드로 복구"되는 문제를 유발했다.
//   PWA(오프라인 캐싱)는 현재 미사용이라 SW를 통째로 제거한다.
//
// 어떻게 동작하나:
//   이미 모든 방문자 브라우저에 설치돼 있는 옛 SW를, 브라우저의 자동 업데이트 체크가
//   이 파일(바이트가 달라짐)을 받으면 →
//     install: 즉시 활성화(skipWaiting)
//     activate: 모든 캐시 삭제 → 자기 자신 unregister → 열린 탭 1회 리로드
//   한 번 청소된 뒤에는 등록이 해제되어 더는 어떤 요청도 가로채지 않는다.
//
// 향후 Web Push 구현 시: 캐싱 없는 최소 SW로 다시 도입 (src/app/sw.ts 참고).
// 주의: Serwist 빌드는 next.config.ts에서 비활성화됨 — 이 파일은 더는 생성물이 아니라
//   "손으로 유지하는 정적 파일"이다. 빌드가 덮어쓰지 않으므로 git에 커밋한다.

self.addEventListener("install", () => {
  // 대기 단계 건너뛰고 즉시 활성화 → 청소를 미루지 않는다.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1) 모든 캐시 스토리지 삭제 (옛 precache·next-image·pages 등 전부)
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // 2) 이 서비스워커 등록 자체를 해제 → 이후 요청은 SW를 거치지 않는다.
      await self.registration.unregister();

      // 3) 제어 중이던 탭들을 1회 리로드 → SW 없는 깨끗한 상태로 다시 로드.
      const clients = await self.clients.matchAll({ type: "window" });
      await Promise.all(
        clients.map((client) =>
          "navigate" in client ? client.navigate(client.url) : undefined,
        ),
      );
    })(),
  );
});
