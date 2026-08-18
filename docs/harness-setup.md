# agent-settings — 하네스 이식 묶음 (Claude Code + Codex)

새 레포로 이 폴더를 옮겨서 agent 플로우를 세팅하기 위한 묶음.
**Claude Code 와 Codex 둘 다** 같은 품질 규격으로 돌게 구성돼 있다.

## 구조

```
shared/                  ★ 단일 진실 소스 (도구 무관) — 사람이 여기를 편집
├─ agent-roles.md        15개 agent 역할 + 도구별 매핑
├─ conventions.md        코딩 규칙·금지·스택
├─ review-standard.md    리뷰 기준 + 고정 템플릿
├─ git-flow.md           브랜치·rebase·PR
├─ domain.md             도메인 (TODO — 인터뷰로 채움)
└─ design-guide.md       디자인 가이드 (디자이너 소유 — 토큰 값은 Figma)

CLAUDE.md + .claude/      Claude Code 용 (shared 참조)
├─ agents/*.md            15개 (YAML frontmatter)
├─ skills/*/SKILL.md      19개 (프로젝트 패턴 + 라이브러리 best-practice)
├─ agent-memory/          project 스코프 (커밋됨)
├─ agent-memory-local/    local 스코프 (비커밋, .gitignore)
└─ settings.json          권한 allow 기본값

AGENTS.md + .codex/       Codex 용 (shared 참조)
├─ agents/*.toml          15개 (TOML)
└─ config.toml            [agents] 동시성·깊이
.agents/skills/*/SKILL.md  Codex 스킬 19개 (Claude skills와 동일 포맷)

BLUEPRINT.md             인터뷰 질문 뱅크 + 설계 원칙 (세팅 가이드)
```

## 설치 (새 레포)

이 폴더 내용을 **새 레포 루트**로 옮긴다:
- `shared/`, `CLAUDE.md`, `.claude/`, `AGENTS.md`, `.codex/`, `.agents/`, `BLUEPRINT.md`, `기획.md`
- `[프로젝트명]` 자리표시자를 실제 이름으로. (`기획.md` = looky 결과 알고리즘 SSOT — `domain.md`·`johari-bigfive`가 "루트 기획.md"로 참조)

## 단일 진실 소스 원칙

- **`shared/` 가 진실 소스.** 컨벤션·역할·리뷰·git·도메인을 여기서 편집한다.
- `.claude/` 와 `.codex/`/`.agents/` 는 도구별 표현 — 역할을 바꾸면 `shared/agent-roles.md` 부터 고치고 양쪽 agent 파일을 다시 생성한다.
- 스킬 SKILL.md 포맷은 두 도구 동일 → `.claude/skills` ↔ `.agents/skills` 내용 일치 유지.
- **Codex로 짠 코드도 code-reviewer 게이트키퍼가 같은 잣대로 검토** → 도구 섞여도 품질 일원화.

## 첫 사용

새 레포에서 **"BLUEPRINT.md / 이 하네스대로 세팅해줘"** 하면, AI가:
1. `BLUEPRINT.md §A 인터뷰 질문 뱅크`로 사용자를 인터뷰 (질문 많이)
2. 답을 `shared/domain.md` 등에 채우고
3. 미정은 `TODO(✍️)`로 남겨 점진적으로

## 미정 (TODO — 새 레포에서 채울 것)

- 도메인 정책 / 제품 경계 / 절대 금지
- Next.js 렌더링 전략 (SSR / Server Component / BFF) → Server/Client 규칙의 전제
- 데이터 페칭 / 상태 관리 (백엔드와 논의)
- 컴포넌트 라이브러리 (shadcn? 디자인 시스템 보고)
- 위험 경로 목록 (인증·결제 등) / 타겟 사용자 / PWA 웹·앱 전략
- Codex `model` 정확한 ID, Figma 변수→토큰 매핑 규칙
