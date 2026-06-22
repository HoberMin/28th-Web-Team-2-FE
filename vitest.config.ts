import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// E2E(Playwright)는 추후. 초기엔 Vitest 유닛 위주 (conventions: 테스트 스택).
// JSX/TSX 변환은 esbuild(jsx automatic)가 처리 — React 플러그인은 Fast Refresh용이라 테스트엔 불필요.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    exclude: ["node_modules", ".next", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@data": fileURLToPath(new URL("./data", import.meta.url)),
    },
  },
});
