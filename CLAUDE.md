# looky — Claude Code 지침

> 공유 규격은 `shared/` 가 진실 소스. 이 파일은 그것을 참조 + Claude 전용 오케스트레이션.
> 서비스 개요는 루트 `README.md`, Codex 쪽 대응 문서는 `AGENTS.md`.

## 공유 규격 (필독)

@shared/conventions.md
@shared/review-standard.md
@shared/git-flow.md
@shared/domain.md
@shared/product-spec.md
@shared/design-guide.md

## IMPORTANT (override)

- 위 `conventions.md` 최상위 규칙을 모든 작업에서 준수.
- **모르면 추측 말고 질문. 미정(TODO) 영역 건드리면 진행 전 묻고 `domain.md`에 기록.**
- 위험 경로·커밋/푸시·배포 직전 = 사용자 확인 게이트.

## 페르소나 게이트 (라우팅보다 먼저)

이 묶음은 **디자이너·프론트 개발자 공용**. 작업 시작 전 **누구의 요청인지부터** 분류한다.

- **신호로 1차 분류**:
  - 디자이너 자문 = 질문형("어떻게 넘기지?", "왜 이렇게 동작해?") · Figma·토큰·핸드오프·플로우 언급 · 코드/파일 미언급
  - 개발 작업 = 명령형("구현해줘", "이 버그") · 파일·코드·API·테스트 언급
- **애매하면 추측 말고 한 줄로 확인** ("핸드오프 관련 질문일까요, 구현 요청일까요?"). 침묵 추측 금지(전역 원칙).
- 분기:
  - **디자이너 자문(질문)** → read-only 자문 agent.
    - 토큰 구조·표기·핸드오프 방법 → **design-handoff-advisor**
    - 제품/플로우 맥락·디자인 요건 점검 → **design-context-advisor**
  - **디자이너 문서 작업**(가이드·룰 기록/수정) → `shared/design-guide.md` 등 **문서를 직접 편집**. 토큰 *값*은 적지 않음(Figma가 진실 소스, 디자이너는 검증만 — `design-guide.md §0`).
  - **개발 작업** → 아래 `라우팅(크기 × 위험)` 그대로.
- **소프트 규칙**: 디자이너 맥락에선 **코드 agent(figma-implementer·frontend-dev 등) 호출을 최대한 자제**. 문서 편집은 코드 agent 거치지 말고 직접. (하드 차단은 아님 — 정말 필요하면 확인 후 호출)

## 라우팅 (크기 × 위험)

```
            위험 낮음            위험 높음
크기 작음   S 바로 진행         게이트 + 리뷰 강제
크기 큼     M 탐색→구현→리뷰    L 기획+게이트 풀절차
```

- 크기: 파일 1-2=작음 / 3-5=중간 / 5+·새기능=큼
- 위험 경로(`TODO(✍️):` 인증·결제 등) 건드리면 크기 무관 한 단계↑ + 게이트
- "바로/빨리"→내림 / "제대로/꼼꼼히"→올림. 단 위험 경로는 못 내림.

## 전용 플로우

- **와이어프레임 초안**(디자인 전): 유저 플로우 → flow-reviewer(CRUD·누락 검수) → [⏸] → wireframe-builder(더미 데이터·저충실도) → 배포(⏸) → 기획·디자이너 피드백. ※ 디자인 토큰 검사 면제, design-reviewer 미적용
- **신규 화면**(디자인 확정 후): Figma 확정(⏸) → figma-implementer → design-reviewer + code-reviewer
- **Bug**: bug-investigator(수정X) → 구현 agent → code-reviewer
- **전수검색**: auditor → 구현(일괄) → code-reviewer
- 리뷰는 "리뷰해줘" 자연어로 트리거 (슬래시 커맨드 안 씀)

## agent

- `.claude/agents/*.md` — 역할 정의는 `shared/agent-roles.md` 가 진실 소스
- 모델 티어: 높음=opus / 중간=sonnet / 낮음=haiku (판단 밀도 기준)

## 미정 (TODO)

- 렌더링 전략(SSR/SC/BFF) · 데이터페칭/상태 · 컴포넌트 라이브러리 · 위험 경로 · 도메인 정책
- → 해당 영역 작업 시 사용자에게 묻고 채운다.
