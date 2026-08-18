# looky — Codex 지침 (AGENTS.md)

> Codex가 읽는 세션 지침. Claude `CLAUDE.md` 와 **동일한 규격**을 따른다.
> 상세 규격은 `shared/` 가 진실 소스 — 필요 시 해당 파일을 읽어라.
> 서비스 개요는 루트 `README.md`. 스킬은 `.agents/skills/` (내용은 `.claude/skills/`와 동일).

## 반드시 지킬 규칙 (shared/conventions.md 요약)

1. `any` 타입 금지
2. Barrel export 금지 (직접 import)
3. 모바일 퍼스트 — 무프리픽스=모바일(sm), `md:` 데스크탑 (예: `p-4 md:p-6`)
4. 요청한 것만 변경 (불필요한 리팩토링 금지)
5. **모르면 추측 말고 질문.** 미정(TODO) 영역 건드리면 진행 전 묻고 `shared/domain.md`에 기록
6. 빌드는 최종 1회만
7. 시크릿/키 클라이언트 노출 금지
8. React hooks는 early return 앞에

## 스택

Next.js + Tailwind / 폼 rhf+zod / pnpm / Vitest+Playwright / Figma+MCP / 프론트 전용 레포 + 외부 Spring(별도). **백엔드 상상해서 만들지 말 것** — 스펙은 `shared/`·실제 API 문서 참조.

## Git (shared/git-flow.md)

작업 브랜치 `feat/`·`fix/`·`refactor/` → rebase `origin/dev` → **충돌 시 사용자에게 묻기** → `git push --force-with-lease`(내 브랜치만, `--force` 금지) → PR. 공유 루트 force push 금지.

## 리뷰 (shared/review-standard.md)

리뷰 출력은 고정 템플릿(🔴Critical/🟡Warning/🟢Suggestion/✅자동수정). Codex가 짠 코드도 이 기준으로 검토 → 도구 섞여도 품질 동일.

## 서브에이전트

- `.codex/agents/*.toml` — 역할 정의 진실 소스는 `shared/agent-roles.md` (총 15)
- 오케스트레이션(동시성·깊이)은 `.codex/config.toml` `[agents]`
- 위험 경로·커밋/푸시·배포 직전 = 사용자 확인

## 페르소나 게이트 (라우팅보다 먼저)

이 묶음은 디자이너·프론트 개발자 공용. 작업 전 누구의 요청인지부터 분류한다.
- 디자이너 자문(질문) → read-only 자문 agent: 토큰·핸드오프 → design-handoff-advisor / 제품·플로우 맥락·요건 점검 → design-context-advisor
- 디자이너 문서 작업(가이드·룰) → shared/design-guide.md 등 문서 직접 편집. 토큰 값은 적지 않음(Figma가 진실 소스, 디자이너는 검증만).
- 개발 작업 = 명령형·파일/코드/API 언급 → 기존 라우팅(크기×위험)
- 소프트 규칙: 디자이너 맥락에선 코드 agent 호출 최대한 자제(하드 차단 아님). 애매하면 추측 말고 한 줄로 확인.

## 전용 플로우

- **와이어프레임 초안**(디자인 전): 유저 플로우 → flow-reviewer(CRUD·누락 검수) → ⏸ → wireframe-builder(더미 데이터·저충실도) → 배포 ⏸. ※ 디자인 토큰 검사 면제
- **신규 화면**(디자인 확정 후): Figma 확정 ⏸ → figma-implementer → design-reviewer + code-reviewer
- **Bug**: bug-investigator(수정X) → 구현 agent → code-reviewer
- **전수검색**: auditor → 구현(일괄) → code-reviewer

## 미정 (TODO)

렌더링 전략(SSR/SC/BFF) · 데이터페칭/상태 · 컴포넌트 라이브러리 · 위험 경로 → 건드릴 때 사용자에게 묻고 `shared/domain.md` 갱신.

## 도메인·제품 스펙

도메인 정책 = `shared/domain.md`, 페이지 단위 스펙 = `shared/product-spec.md`. 작업 전 해당 페이지/엔티티 스펙을 읽어라.
