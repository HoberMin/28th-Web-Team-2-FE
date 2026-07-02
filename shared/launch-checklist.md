# 출시 전 남은 작업 체크리스트 (single source) — looky.my

> 디자인 에셋 + 인프라/SEO/분석 등 "아직 안 된 것"을 한곳에 모은 백로그.
> 상태는 **실제 코드 확인 기준**(추측 금지). 채우거나 끝나면 이 문서를 갱신.
> 페이지 단위 스펙은 `product-spec.md`, 도메인 정책은 `domain.md` 참조.
> 최종 확인일: 2026-06-23

---

## ✅ 이미 되어 있는 것 (오해 방지용 — 다시 안 해도 됨)

- **메타데이터**: `src/app/layout.tsx` — title/description/OpenGraph/Twitter 완비, `metadataBase: https://looky.my`, OG 이미지 `/assets/og-image.png`(1200×630).
- **sitemap**: `src/app/sitemap.ts` — **의도적으로 랜딩(루트) 1개만 등록.** 토큰 URL(설문·공유·결과)은 검색 노출 = 개인 결과 유출이라 색인 제외(`domain.md §3`). "비어있는" 게 아니라 정책상 1개.
- **robots**: `src/app/robots.ts` — `allow: /$`(랜딩만), 나머지 `disallow`. 토큰 페이지 보호.
- **PWA manifest**: `src/app/manifest.ts` — name/short_name/description/start_url/display/theme 등 채워짐. 아이콘은 `/icon.svg`만(아래 미완 참조).
- **PWA 아이콘(SVG)**: `public/icon.svg` 커스텀 존재(605B).
- **서비스워커/PWA 패키징**: Serwist(`@serwist/next`) 설정됨(`next.config.ts`, dev에선 비활성).

---

## 🎨 디자인 / 에셋 (디자이너 핸드오프 대기)

- [ ] **브랜드 favicon** — 현재 `src/app/favicon.ico`는 **Next.js 기본 템플릿(25931B)**. looky 브랜드 favicon으로 교체 필요.
- [ ] **PWA 설치 아이콘 192/512 PNG (maskable)** — `manifest.ts:16` TODO. 현재 `icon.svg`만 등록 → 안드로이드 설치 프롬프트·maskable 대응 위해 PNG 필요. 디자인 에셋 확정 후.
- [ ] **화면 내 placeholder 일러스트** (코드에 자리만 있고 에셋/디자인 대기 — auditor 점검 2026-06-23):
  - `result-view.tsx:85` 결과 게이트 화면 일러스트
  - `result-view.tsx:190,196` 결과 본문 칸별 이미지 (← 서버 AI 생성물 자리, 아래 인프라 항목과 연동)
  - `share-view.tsx:114` 공유 화면 중앙 일러스트 (에셋 미확정)
  - `respondent-view.tsx:43` intro 카운트다운 GIF ("3,2,1 캐릭터" 삽입 예정)
  - `respondent-view.tsx:99` 친구설문 완료 화면 일러스트 — **`character-insight.png`로 바로 채울 수 있음**(랜딩과 동일 에셋)
  - `expired-view.tsx:12` 만료 뷰 "안개·물음표" 이미지 — **에셋 자체가 아직 public에 없음**
- [x] ~~인스타 스토리 공유 이미지 규격~~ — 스토리 공유 이미지 미사용 결정(2026-07-02). `/assets/story-share.png` 삭제됨.
- [ ] **랜딩 캐릭터 세로 위치** — 현재 `figma-loose`(flex-1 중앙 근사). Figma F01은 절대 top 316px. 픽셀 정합 원하면 조정.

> 디자인 토큰 *값*은 이 문서에 적지 않음 — 진실 소스는 Figma Variables (`design-guide.md §0`).

## 🛠 인프라 / SEO / 분석 (개발)

- [ ] **GA4 / 분석 도구** — **미설치.** `src`에 gtag/analytics/@next/third-parties 참조 전무. `domain.md §6` 핵심 퍼널(링크공유→참여완료 / 자기설문완료→공유 / 결과도달→재공유) 측정 도구 택1~2 미정.
- [ ] **결과 페이지 동적 OG** — `layout.tsx:7` 주석에 언급. 개인 결과 공유 카드는 `[token]/page`에서 `generateMetadata`로 별도 구현 필요(현재 전역 OG만).
- [ ] **AI 생성 이미지 연동** — `result-view.tsx` 칸별 이미지가 서버(외부 Spring) AI 생성물 동적 URL을 받아야 함. 현재 회색 `div` placeholder (`domain.md §3`, 서버 대기).

## ❓ 미정 — 개발자/기획 논의 필요 (domain.md TODO와 연동)

- [ ] 24h 만료·전환 책임 위치(클라/서버), 만료 링크 404 vs 만료 안내 규격
- [ ] 닉네임 길이·금칙어 규칙
- [ ] 형용사 가이드라인 기준, 한 칸 후보 복수 시 처리
- [ ] PWA 웹/앱 디자인 분리 전략, 전역 클라이언트 상태 도구
