# 디자인 시스템 현황 감사

> 측정 시점: 2026-08-18 · 대상: `src/` 전체 + `src/app/globals.css`
> 기준: `shared/review-standard.md` 탐지 패턴, `frontend-design`·`tailwind-v4` 스킬
> 토큰 **값**의 진실 소스는 Figma (`shared/design-guide.md §0`) — 이 문서는 **코드 쪽 정합성**만 본다.

## 1. 결론 요약

| 항목 | 상태 |
|---|---|
| 토큰 체계 존재 | ✅ `@theme`에 color 61 · text 83 · radius 9 · font 5 |
| 토큰 카탈로그 화면 | ✅ `/playground` (전량·런타임 조회) · `/style-guide` (초기·하드코딩) |
| 공용 UI 컴포넌트 | ✅ 11개 + 아이콘 5개 |
| raw hex 위반 | ✅ **없음** (23건 전부 정당 — §3) |
| **arbitrary value** | ⚠️ **30건** (§4 · 54 → 30으로 감소, §5 진행분 반영) |
| spacing 스케일 토큰 | ⚠️ 의미 토큰 없음 — Tailwind 기본 스케일에 의존 |
| 앱 프레임 치수 | ✅ 토큰화 완료 (`--width-app-frame` / `--height-app-frame`) |

**한 줄 평**: 디자인 시스템은 "없다"가 아니라 **"있는데 간격·치수 축이 비어 있다"**. 색·타이포는 촘촘히 토큰화됐지만 spacing/size는 토큰이 없어 Figma의 실측값이 arbitrary value로 새어 들어왔다.

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

## 4. arbitrary value 54건 — 실제 개선 대상

### 4-1. 파일별

> 아래는 **result-view 분리(2026-08-18) 이후** 재측정한 값이다. 총량은 54건으로 그대로이고 위치만 재배치됐다 (`result-view` 10 → 2 + `result-four-cuts` 7 + `result-gate` 1).

| 건수 | 파일 |
|---|---|
| 10 | `app/[token]/_components/result-card-modal.tsx` |
| 7 | `app/[token]/_components/result-four-cuts.tsx` |
| 5 | `components/ui/tooltip.tsx` |
| 5 | `components/ui/cta-small.tsx` |
| 5 | `app/[token]/_components/result-tap-hint.tsx` |
| 4 | `components/ui/btn-survey.tsx` |
| 3 | `app/layout.tsx` · `app/[token]/_components/share-cards.tsx` |
| 2 | `components/layout/centered-screen.tsx` · `result-view.tsx` · `result-loading.tsx` · `generating-view.tsx` |
| 1 | `components/ui/textfield.tsx` · `cta.tsx` · `share-view.tsx` · `result-gate.tsx` |

⚠️ **탐지 시 오탐 주의**: `grep` 으로 세면 `app/playground/_components/radius-section.tsx` 가 6건 걸리지만 전부 **주석·`<code>` 설명 텍스트**다(이 규칙을 설명하는 문장 자체). Tailwind 클래스가 아니므로 제외해야 총 54건이 나온다.

### 4-2. 속성별

`w` 8 · `px` 8 · `rounded` 7 · `pb` 3 · `max-w` 3 · `left` 3 · `h` 3 · `bottom` 3 · `py` 2 · `pt` 2 · `border-x` 2 · `border-t` 2 · 기타 각 1

### 4-3. 성격별 3분류

**① 앱 프레임 치수 — 가장 위험 (우선순위 1)**

`390px`가 **3곳에 흩어져 있고 서로 일치해야 한다.**

| 위치 | 용도 |
|---|---|
| `app/layout.tsx:59` | `md:w-[390px] md:h-[844px]` — 데스크탑 폰 프레임 목업 |
| `result-view.tsx:197` | `max-w-[390px]` — 하단 고정 CTA 바 |
| `result-card-modal.tsx:80` | `max-w-[390px]` — 모달 오버레이 |

하나만 바꾸면 **하단 고정바가 프레임과 어긋난다.** 값이 코드에 흩어진 채 "같아야 한다"는 제약이 어디에도 표현되지 않은 상태다. → `--size-app-frame` 류 토큰 1개로 묶어야 한다.

> 관련: Figma 절대좌표(390 폭·상태바 44px 가정)를 앱으로 옮길 때 오버레이는 실측/상대배치로 풀어야 한다.

**② radius 7건** — `rounded-[7px]`·`[7.75px]`·`[9px]`·`[14px]`

`--radius-field`(12px)·`--radius-cta`(16px)처럼 **의미 토큰**이 이미 있는데, 중첩 요소(툴팁 화살표, 카드 내부)는 Figma 실측값이 그대로 박혔다. `7.75px` 같은 값은 Figma의 계산 결과이지 의도된 스케일이 아닐 가능성이 높다. → 디자이너 확인 필요.

**③ 간격·이미지 치수** — `px-[16px]`·`w-[350px]`·`w-[270px]` 등

`px-[16px]`는 Tailwind 기본 스케일의 `px-4`와 동일하므로 **단순 치환 가능**. `w-[350px]`류 이미지 폭은 대부분 `max-w-full`과 함께 쓰여 반응형 안전장치는 있다.

## 5. 권고 (우선순위) — 진행 현황

1. ✅ **앱 프레임 토큰화 (완료 2026-08-18)** — `--width-app-frame`/`--height-app-frame` 신설. 흩어져 있던 `390px` 3곳을 토큰 하나로 묶었다.
   - ⚠️ 알아둘 점: `max-w-*` 는 `--width-*` 네임스페이스로 유틸리티가 **생성되지 않는다**(Tailwind v4에서 `max-w-*` 는 `--container-*`). 값을 복제하면 토큰화 의미가 없어 `max-w-(--width-app-frame)` 으로 변수를 직접 참조했다. 생성 CSS로 검증 완료.
2. ✅ **기본 스케일 치환 (완료 2026-08-18)** — 14종 치환. `px-[16px]`→`px-4`, `p-[8px]`→`p-2`, `pb-[92px]`→`pb-23`, `w-[324px]`→`w-81`, `gap-[2px]`→`gap-0.5` 등. 생성된 CSS에서 전 항목이 기대 px와 일치함을 확인했다.
   - `rounded-*`·`border-*`·`backdrop-blur-*` 는 **spacing 스케일을 쓰지 않아 제외**했다(4로 나눠 치환하면 값이 달라진다).
3. ⏳ **radius 실측값 디자이너 확인** — `7px`·`7.75px`·`9px`·`14px`·`18px`·`21px`가 의도된 값인지. 의도됐다면 의미 토큰 추가, 아니면 기존 토큰으로 흡수. **미해결**.
4. ⏳ **spacing 의미 토큰 도입 검토** — 화면 여백 규칙이 Figma에서 확정된 뒤에. **미해결**.
5. ⏳ **소수·비스케일 잔여값** — `w-[350px]`(3곳)·`w-[270px]`·`pt-[21px]`·`px-[14px]`·`py-[3px]`·`mt-[14px]`·`ml-[18px]`·`left/bottom-[7px]`·`border-x-[7.75px]` 등. 대부분 Figma 실측값이라 3번 확인이 선행되어야 한다.

⚠️ **3·5번은 컴포넌트 파일을 건드린다.** 2026-08-18 기준 테스트는 **120개**(12개 파일)로 늘었고 `[token]` 상태머신·fetch 래퍼·result-view 는 characterization 테스트가 덮고 있다. 다만 **시각적 회귀를 잡는 테스트는 아직 없다**(Playwright 미도입) — 픽셀이 바뀌는 변경은 여전히 눈으로 확인해야 한다.

## 5-1. `/playground` (2026-08-18 추가)

토큰·컴포넌트를 한 화면에서 확인하고 링크로 공유하는 페이지를 만들었다. 섹션 9개 — 색 / 타이포그래피 / Radius·치수 / 버튼 / 폼 / 진행·안내 / 아이콘·로고 / 인생네컷 / 상태 3종.

**설계상 중요한 점 2가지**

1. **토큰 값을 화면 코드에 적지 않는다.** `getComputedStyle` 로 실제 CSS 변수를 읽는다. `/style-guide` 는 hex를 하드코딩해서 `@theme` 에 토큰이 늘어도 화면이 따라오지 못했다 — `blue-900`·`pink-300`·`yellow-200/800`·`green-200/300`·`kakao`·시맨틱 아이콘 색·`head2/14` 가 전부 빠져 있었다.
2. **화면과 같은 컴포넌트를 렌더한다.** `ResultFourCuts`·`ResultStatusScreen` 을 결과 화면에서 분리해뒀기 때문에 플레이그라운드가 그대로 재사용한다 → 여기서 확인한 것이 실제 화면과 어긋날 수 없다.

**`/style-guide` 처리** — 역할이 완전히 포함되므로 제거 후보다. 다른 사람이 만든 화면이라 이번엔 손대지 않았다. `TODO(✍️)`: 팀 확인 후 제거 여부 결정.

## 6. 미정

- `TODO(✍️)`: radius 실측값(7/7.75/9/14px) 의도 여부 — 디자이너
- `TODO(✍️)`: spacing 의미 토큰 체계 도입 여부·명명 — 디자이너 + 프론트
- `TODO(✍️)`: 데스크탑 폰 프레임 목업(390×844)을 정식 스펙으로 둘지 — 기획
