# looky — 친구들이 본 나를 인생네컷으로

> **looky.my** — 또래 인식 서비스. 친구들의 설문으로 "나를 찍은 인생네컷(4컷)"을 만들어준다.

본인이 보는 나와 친구가 보는 나 사이의 갭에서 반전과 발견이 생긴다. **조하리의 창**을 실제 동작 틀로 삼아, 설문 응답에서 형용사를 추출해 4칸(2×2) 인생네컷으로 보여준다.

## 어떻게 동작하나

```
[주인공]  닉네임 설정 → 자기 설문(8문항) → 고유 링크 생성 → 공유(인스타 스토리·카톡)
              ↓
          친구 응답 3건이 채워지는 즉시 → 결과(인생네컷 + 설명문) 자동 전환

[참여자]  공유 링크 진입 → 그 사람에 대한 설문(8문항) → 제출 → "나도 만들기"
```

- **비회원 서비스** — 가입·로그인 없음. 식별은 **고유 링크(URL) + 로컬스토리지 닉네임**뿐이다.
- **링크가 곧 결과의 열쇠** — 링크를 아는 사람은 누구나 결과를 본다. 그래서 URL 토큰은 추측 불가능해야 한다(순번 ID 금지).
- **시간 제한 없음** — 응답 3건이 모일 때까지 수집 화면에 머문다. (2026-07-05 확정)

결과 4칸은 조하리의 창을 따른다 — ① 모두가 아는 나 ② 친구만 아는 나 ③ 나만 아는 나 ④ 아직 모르는 나. 내용이 있는 칸만 AI로 이미지를 생성하고, **빈 칸은 고정 이미지(안개·물음표) + 재참여 유도 메시지**로 채운다.

## 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) — **CSR 중심**, BFF·SSR·Server Component 안 씀 |
| 스타일 | Tailwind CSS v4 (CSS-first `@theme`) + shadcn/ui |
| 서버 상태 | TanStack Query + native fetch 래퍼(`ApiError` throw) |
| 폼 | react-hook-form + zod |
| PWA | **현재 비활성** — Serwist는 2026-06-24에 걷어냈다(아래 참고) |
| 테스트 | Vitest (유닛). Playwright(E2E)는 추후 |
| 분석 | Mixpanel |
| 패키지 매니저 | pnpm |

### PWA가 꺼져 있는 이유

`@serwist/next`의 `defaultCache`(네비게이션·RSC·`_next/image` 런타임 캐싱)와 `skipWaiting`/`clientsClaim` 조합이 재배포마다 서비스워커 takeover race를 일으켜, `_next/image`·RSC 요청이 `net::ERR_FAILED`로 터졌다가 리로드로 복구되는 문제를 만들었다. 오프라인 캐싱이 당장 필요하지 않아 **2026-06-24에 통째로 비활성화**했다.

`public/sw.js`는 이미 사용자 브라우저에 설치된 옛 SW를 청소하는 **자폭 서비스워커**다. 빌드 생성물이 아니라 손으로 유지하는 정적 파일이므로 git에 커밋되어 있다. Web Push를 실제로 구현할 때 **캐싱 없는 최소 SW**로 다시 도입한다 (`src/app/sw.ts` 참고).

**백엔드는 외부 Spring 레포**다. 이 레포에는 백엔드 구현이 없다. AI 파이프라인(형용사 추출 / 이미지 생성 / 설명문 생성)도 전부 서버 소관이고, 프론트는 상태를 폴링해 결과만 렌더한다.

## 실행

```bash
pnpm install
cp .env.example .env.local   # 값 채우기
pnpm dev
```

| 스크립트 | 설명 |
|---|---|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 (타입체크 포함) |
| `pnpm test` | Vitest 1회 실행 |
| `pnpm test:watch` | Vitest watch |
| `pnpm lint` | ESLint |

## 구조

```
src/
├─ app/
│  ├─ [token]/            주인공·참여자 공용 링크 — 상태로 뷰 분기
│  │  └─ _components/     share / respondent / generating / result / retry view
│  ├─ onboarding/         nickname → survey (주인공 온보딩)
│  ├─ playground/         디자인 시스템 플레이그라운드 (토큰 + 공용 컴포넌트)
│  └─ style-guide/        초기 토큰 카탈로그 (playground로 대체됨)
├─ apis/survey/           keys · queries · mutations · types
├─ components/
│  ├─ survey/             설문 러너
│  └─ ui/                 CTA · 텍스트필드 · 프로그레스 등 공용 UI
├─ hooks/  lib/           로컬 세션 · 공유 · 분석 · 이미지 프리로드
└─ test/
```

**한 URL이 상태에 따라 다른 화면이 된다** — `src/app/[token]/page.tsx`가 `surveyStatus`/`resultStatus`를 읽어 수집 중 / 참여자 설문 / 생성 중 / 결과 / 재시도 뷰로 분기한다.

## 문서

진실 소스는 `shared/`다. 도구(Claude Code · Codex) 양쪽이 같은 문서를 참조한다.

| 문서 | 내용 |
|---|---|
| `shared/domain.md` | 도메인 · 정책 · 유저 플로우 |
| `shared/product-spec.md` | 페이지 단위 스펙 (목적 / 데이터 / 상태 3종) |
| `shared/conventions.md` | 코딩 컨벤션 · 스택 확정 사항 |
| `shared/review-standard.md` | 리뷰 기준 + 고정 출력 템플릿 |
| `shared/git-flow.md` | 브랜치 · 커밋 · PR |
| `shared/design-guide.md` | 디자인 원칙 (토큰 **값**의 진실 소스는 Figma) |
| `shared/api.md` | 외부 Spring API 계약 |
| `docs/` | LLM 프롬프트 원본 · UT 기록 · 하네스 세팅 가이드 |

## 개발 규칙 (요약)

전문은 `shared/conventions.md`.

1. `any` 타입 금지
2. Barrel export 금지 — `index.ts` re-export 없이 직접 import
3. **모바일 퍼스트** — 무프리픽스 = 모바일, `md:`부터 데스크탑
4. 요청한 것만 변경
5. 모르면 추측 말고 질문
6. 시크릿을 클라이언트 번들·로그에 노출 금지
7. React hooks는 early return 앞에

## 카피 톤 (중요)

결과 형용사는 **긍정/중립만** 쓴다. 비하·외모 평가·차별적 단어, 상처를 줄 직설적 부정어는 금지다. 부정 신호는 매력적인 표현으로 환원한다 — 예: 내향성 → "혼자만의 시간을 아는".
