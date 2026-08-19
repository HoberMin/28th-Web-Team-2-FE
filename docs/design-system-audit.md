# 디자인 시스템 현황 감사

> 측정 시점: **2026-08-19 (2차 — 통일 완료)** · 대상: `src/` 전체 + `src/app/globals.css`
> 기준: `shared/review-standard.md` 탐지 패턴, `frontend-design`·`tailwind-v4` 스킬
> 토큰 **값**의 진실 소스는 Figma (`shared/design-guide.md §0`) — 이 문서는 **코드 쪽 정합성**만 본다.

## 1. 결론 요약

| 항목 | 상태 |
|---|---|
| 토큰 체계 존재 | ✅ `@theme`에 color 61 · text 83 · radius 9 · font 5 |
| 토큰 카탈로그 화면 | ✅ `/playground` (전량·런타임 조회) · `/style-guide` (초기·하드코딩) |
| 공용 UI 컴포넌트 | ✅ 11개 + 아이콘 5개 |
| raw hex 위반 | ✅ **없음** (23건 전부 정당 — §3) |
| **arbitrary value** | ✅ **0건** (§4 · 54 → 0, 전량 토큰·스케일로 통일) |
| spacing 스케일 토큰 | ⚠️ 의미 토큰 없음 — Tailwind 기본 스케일(4px 그리드)에 의존 |
| 앱 프레임 치수 | ✅ 토큰화 완료 (`--width-app-frame` / `--height-app-frame`) |

**한 줄 평 (2차)**: 1차에서 지적한 "간격·치수 축이 비어 있다"를 해소했다. Figma 실측값 54건을 전부 토큰·4px 그리드로 통일해 **실코드의 arbitrary value 는 0건**이다. 남은 과제는 spacing *의미* 토큰(예: `--space-section`) 도입 여부뿐이며, 이는 Figma 여백 규칙이 확정된 뒤의 일이다.

## 2. 토큰 구조

`src/app/globals.css`가 Tailwind v4 CSS-first 방식으로 정의한다.

```
:root            (10~45)    원시 변수
@theme inline    (46~98)    shadcn 브리지 (--color-background 등)
@theme           (99~285)   ★ 프로젝트 토큰 (팔레트 리셋 + 정의)
@layer base      (286~)     기본 스타일
```

- **팔레트 리셋**: `--color-gray-*: initial` 등으로 Tailwind 기본 색을 지우고 우리 팔레트만 남긴다 → 화이트리스트가 CSS 레벨에서 강제된다. 좋은 구조.
- **타이포**: `text-head1-26` / `text-body-16-medium` / `text-caption-12-regular` 형태로 크기·굵기가 토큰명에 박혀 있고 `letter-spacing`까지 포함(head −0.02em / body −0.03em).
- **radius**: 스케일 7종(`sm`~`4xl`) + 의미 토큰 2종(`--radius-field` 12px, `--radius-cta` 16px).

## 3. raw hex 23건 — 전부 정당 (오탐 주의)

`review-standard.md`의 `#[0-9a-fA-F]{6}` 패턴에 걸리지만 **위반이 아니다.** 리뷰어가 반복해서 지적하지 않도록 기록한다.

| 위치 | 건수 | 왜 정당한가 |
|---|---|---|
| `app/style-guide/page.tsx` | 18 | **토큰 카탈로그의 스와치 라벨** — 토큰값을 화면에 보여주는 것이 목적 |
| `app/page.tsx:34` | 2 | **주석** (Figma 변수 확정 근거 기록) |
| `app/manifest.ts` · `app/layout.tsx` | 3 | `theme-color` / manifest 색 — CSS 변수를 못 쓰는 자리 |

## 4. arbitrary value — 54건 → 0건 (2026-08-19 통일 완료)

디자이너 리뷰를 기다리지 않고 **"실측 7px 은 8px 의도였다"** 는 전제로 통일했다. 판단 기준을 남겨 나중에 되돌리거나 재검토할 수 있게 한다.

### 4-1. 적용한 규칙

| 상황 | 처리 | 픽셀 변화 |
|---|---|---|
| 스케일에 **정확히 대응**되는 값 | 해당 토큰/스텝으로 교체 | **0** |
| **홀수**(7·9·21·3px) | 가장 가까운 4px 그리드 | ≤1px |
| 소수(7.75px) | 4px 그리드 | ≤1px |
| 의도가 분명한 고유 값(20·40px) | **의미 토큰 신설** | **0** |
| pill 형태(21px = 높이 절반) | `rounded-full` | 0 (외관 동일) |

### 4-2. 실제 변환표

**픽셀 보존 — 스케일에 정확히 대응**

| 변경 전 | 변경 후 | 값 |
|---|---|---|
| `px-[14px]` `mt-[14px]` `left-[14px]` `bottom-[14px]` | `-3.5` | 14px |
| `pt-[18px]` `ml-[18px]` | `-4.5` | 18px |
| `w-[350px]` ×3 | `w-87.5` | 350px |
| `w-[270px]` | `w-67.5` | 270px |
| `rounded-[14px]` | `rounded-xl` | 14px |
| `rounded-[18px]` | `rounded-2xl` | 18px |
| `rounded-[2px]` | `rounded-xs` | 2px |

**4px 그리드로 정규화 — 최대 1px 이동**

| 변경 전 | 변경 후 | 이동 |
|---|---|---|
| `left-[7px]` `bottom-[7px]` | `-2` (8px) | +1px |
| `py-[3px]` | `py-1` (4px) | +1px |
| `pt-[21px]` | `pt-5` (20px) | −1px |
| `rounded-[4px]` | `rounded-sm` (6px) | +2px |
| `backdrop-blur-[10px]` | `backdrop-blur-md` (12px) | +2px |
| 툴팁 꼬리 `border-x-[7.75px]`/`border-t-[9px]`/`-bottom-[9px]` | `border-x-8`/`border-t-8`/`-bottom-2` | 꼬리 15.5×8.5 → 16×8 |

**의미 토큰 신설 — 값 유지**

| 토큰 | 값 | 용도 |
|---|---|---|
| `--width-app-frame` / `--height-app-frame` | 390 / 844px | 데스크탑 기기 프레임. 하단 고정바·모달이 이 폭과 **일치해야 한다** |
| `--radius-app-frame` | 40px | 기기 프레임 모서리 |
| `--radius-card` | 20px | 공유 안내 카드 (프로젝트 스케일에 20px 단계 없음) |

### 4-3. 검증 방법

Tailwind 는 클래스가 **실제로 CSS 를 생성하는지** 눈으로 확인하지 않으면 조용히 무효가 된다. 실제로 이번에 두 번 걸렸다.

- `max-w-app-frame` 은 **생성되지 않았다** — v4 에서 `max-w-*` 는 `--container-*` 네임스페이스다. 값을 복제하지 않으려고 `max-w-(--width-app-frame)` 으로 변수를 직접 참조했다.
- 소수 스텝(`px-3.5`·`w-87.5`)은 `.md` 파일 스캔에서는 생성되지 않아 한때 "미지원"으로 오판했으나, `.tsx` 에서는 정상 생성된다.

→ 모든 변환은 빌드 후 생성된 CSS 에서 선택자와 계산값을 대조해 확인했다.

### 4-4. playground 의 6건은 오탐

`app/playground/_components/radius-section.tsx` 가 이 규칙을 **설명하는 문장**에서 `[7px]` 등을 언급한다. Tailwind 클래스가 아니므로 실코드 집계에서 제외한다.

## 5. 권고 (우선순위) — 진행 현황

1. ✅ **앱 프레임 토큰화 (완료 2026-08-18)** — `--width-app-frame`/`--height-app-frame` 신설. 흩어져 있던 `390px` 3곳을 토큰 하나로 묶었다.
   - ⚠️ 알아둘 점: `max-w-*` 는 `--width-*` 네임스페이스로 유틸리티가 **생성되지 않는다**(Tailwind v4에서 `max-w-*` 는 `--container-*`). 값을 복제하면 토큰화 의미가 없어 `max-w-(--width-app-frame)` 으로 변수를 직접 참조했다. 생성 CSS로 검증 완료.
2. ✅ **기본 스케일 치환 (완료 2026-08-18)** — 14종 치환. `px-[16px]`→`px-4`, `p-[8px]`→`p-2`, `pb-[92px]`→`pb-23`, `w-[324px]`→`w-81`, `gap-[2px]`→`gap-0.5` 등. 생성된 CSS에서 전 항목이 기대 px와 일치함을 확인했다.
   - `rounded-*`·`border-*`·`backdrop-blur-*` 는 **spacing 스케일을 쓰지 않아 제외**했다(4로 나눠 치환하면 값이 달라진다).
3. ✅ **radius·실측값 통일 (완료 2026-08-19)** — §4 참조. 디자이너 확인을 기다리지 않고 4px 그리드 전제로 통일했다. 되돌릴 근거가 §4-2 변환표에 남아 있다.
4. ⏳ **spacing 의미 토큰 도입 검토** — 화면 여백 규칙이 Figma에서 확정된 뒤에. **미해결**.
5. ✅ **소수·비스케일 잔여값 (완료 2026-08-19)** — 전량 처리. 실코드 arbitrary value 0건.

⚠️ **컴포넌트 파일을 건드리는 작업 주의.** 2026-08-19 기준 테스트는 **215개**(19개 파일)로 늘었고 `[token]` 상태머신·fetch 래퍼·API 레이어(queries/mutations)·result-view·share-cards 는 characterization 테스트가 덮고 있다. 다만 **시각적 회귀를 잡는 테스트는 아직 없다**(Playwright 미도입) — 픽셀이 바뀌는 변경은 여전히 눈으로 확인해야 한다.

## 5-1. `/playground` (2026-08-18 추가)

토큰·컴포넌트를 한 화면에서 확인하고 링크로 공유하는 페이지를 만들었다. 섹션 9개 — 색 / 타이포그래피 / Radius·치수 / 버튼 / 폼 / 진행·안내 / 아이콘·로고 / 인생네컷 / 상태 3종.

**설계상 중요한 점 2가지**

1. **토큰 값을 화면 코드에 적지 않는다.** `getComputedStyle` 로 실제 CSS 변수를 읽는다. `/style-guide` 는 hex를 하드코딩해서 `@theme` 에 토큰이 늘어도 화면이 따라오지 못했다 — `blue-900`·`pink-300`·`yellow-200/800`·`green-200/300`·`kakao`·시맨틱 아이콘 색·`head2/14` 가 전부 빠져 있었다.
2. **화면과 같은 컴포넌트를 렌더한다.** `ResultFourCuts`·`ResultStatusScreen` 을 결과 화면에서 분리해뒀기 때문에 플레이그라운드가 그대로 재사용한다 → 여기서 확인한 것이 실제 화면과 어긋날 수 없다.

**`/style-guide` 처리** — 역할이 완전히 포함되므로 제거 후보다. 다른 사람이 만든 화면이라 이번엔 손대지 않았다. `TODO(✍️)`: 팀 확인 후 제거 여부 결정.

## 6. 미정

- `TODO(✍️)`: §4-2 변환표를 디자이너와 **사후 확인** — 1~2px 이동한 항목이 의도와 맞는지 (되돌리려면 표의 "변경 전" 값으로 복원)
- `TODO(✍️)`: spacing 의미 토큰 체계(예: `--space-section`) 도입 여부·명명 — 디자이너 + 프론트
- `TODO(✍️)`: 데스크탑 폰 프레임 목업(390×844)을 정식 스펙으로 둘지 — 기획
- `TODO(✍️)`: 라벨칩 `rounded`(현재 10px) ↔ Figma 주석의 `rounded4` 불일치 — 실측값 통일 대상이 아니라 별건
