# 이미지 최적화 — 현황과 남은 과제

> 루트 `이미지개선.md`(대화 메모)를 레포 실측치와 함께 문서로 정리한 것.
> 측정 시점: 2026-08-18

## 1. 현재 상태

| 항목 | 실측 |
|---|---|
| `next/image` 사용처 | **12곳** |
| raw `<img>` 사용처 | **0곳** |
| `public/` 총 용량 | **약 10MB** |
| `next.config.ts`의 `images` 설정 | **없음** (기본값 사용) |

메모에 있던 "**`<img>` 대신 `next/image`를 쓰라**"는 항목은 **이미 완료**다. 전 화면이 `next/image`를 통하고 있어서 WebP/AVIF 변환·srcset·lazy loading은 자동으로 적용되고 있다.

## 2. 무거운 에셋 (상위 10개)

| 파일 | 크기 |
|---|---|
| `public/assets/img_character_hamster_film.png` | 1,236 KB |
| `public/assets/og-image.png` | 1,212 KB |
| `public/assets/img_character_hamster_desk_standing.png` | 1,052 KB |
| `public/assets/img_character_hamster_desk_writing.png` | 1,028 KB |
| `public/assets/img_character_hamster_insight_noword.png` | 824 KB |
| `public/assets/img_character_hamster_letter.png` | 720 KB |
| `public/assets/img_character_hamster_up.png` | 716 KB |
| `public/assets/img_character_hamster_down.png` | 696 KB |
| `public/assets/img_character_hamster_star.png` | 652 KB |
| `public/assets/img_character_hamster_sad.png` | 648 KB |

## 3. 남은 과제

### ① `og-image.png` — `next/image`를 거치지 않는다 (실측 2026-08-19)

OG 이미지는 크롤러가 `<meta>`의 URL로 **원본을 직접** 가져간다. `next/image`의 자동 변환 대상이 아니므로 위 최적화가 하나도 적용되지 않는다. **원본 자체를 줄여야 하는 유일한 케이스**다.

| 항목 | 실측값 |
|---|---|
| 크기 | **1,211 KB** (1,239,766 bytes) |
| 해상도 | **1200 × 1200** (1:1 정방형) |
| 포맷 | PNG |

카카오톡·인스타 공유가 핵심 유입 경로라 **미리보기 로딩 속도가 곧 전환율**이다.

**세 가지 사안이 얽혀 있다 — 판단 주체가 다르므로 분리해 적는다.**

1. **✅ 해결됨 — 메타 선언 불일치**: `layout.tsx`가 `800×800`으로 선언하고 있었으나 실제는 `1200×1200`이었다. 크롤러가 선언값으로 레이아웃을 잡으므로 잘못된 비율로 렌더될 수 있었다. 실제 값으로 수정했다.

2. **⏳ 용량 (프론트 판단)**: 1.2MB는 정방형 캐릭터 일러스트치고 과하다. 해상도·픽셀을 그대로 두고 **무손실 재인코딩만으로도 상당히 줄어들 것**으로 보이나, 이 개발 환경에 `oxipng`·`optipng`·`pngquant`·`zopflipng`가 없어 실행하지 않았다. WebP 변환은 카카오 등 일부 크롤러의 지원이 불확실해 OG용으로는 권하지 않는다.
   - `TODO(✍️)`: 무손실 PNG 최적화 도구 도입 후 재인코딩 (픽셀 변화 없음 → 디자이너 확인 불필요)

3. **⏳ 비율 (디자이너·기획 판단)**: OG 표준 권장은 **1.91:1 (1200×630)**, 카카오 피드는 2:1을 선호한다. 현재 1:1 정방형은 플랫폼마다 크롭·레터박스가 달라진다. 또한 `twitter.card`가 `summary_large_image`로 선언돼 있는데 이 카드는 약 1.91:1을 기대하므로 **정방형 이미지의 위아래가 잘린다** — 정방형을 유지할 거라면 `summary`가 맞고, `summary_large_image`를 유지할 거라면 와이드 에셋이 필요하다.
   - `TODO(✍️)`: 정방형 유지 여부 → 유지 시 twitter card 를 `summary`로, 와이드 전환 시 1200×630 에셋 재출력

### ② 캐릭터 PNG 원본이 무겁다

`next/image`가 변환해 주더라도 **변환의 입력이 되는 원본**이 무거우면 서버 처리 비용과 빌드 용량이 그대로 남는다. 투명도가 필요한 캐릭터 그래픽이라 PNG 자체는 타당하지만, 원본 해상도가 실제 표시 크기보다 과도한지 점검할 여지가 있다.

### ③ 모바일 퍼스트 `sizes` 점검

`fill`을 쓰는 곳에 `sizes`가 없으면 뷰포트와 무관하게 큰 해상도를 받는다. 주 타겟이 모바일이므로 실효가 크다.

```jsx
<Image src="..." fill sizes="(max-width: 768px) 100vw, 50vw" />
```

## 4. 참고 — 일반 기법 요약

원본 메모의 내용 중 아직 유효한 부분.

1. **`priority`** — LCP에 잡히는 첫 화면 히어로 이미지는 lazy load를 끄고 먼저 당겨온다.
2. **`placeholder="blur"`** — 실제 속도가 아니라 **체감**을 개선한다. 로컬 import 이미지는 `blurDataURL`이 자동 생성된다.
3. **`width`/`height` 명시** — 레이아웃 시프트(CLS)를 없앤다.
4. **포맷 선택** — 사진성 이미지는 JPG/WebP, 아이콘·로고는 SVG. PNG는 투명도가 필요한 그래픽에만.
5. **비용 주의** — Vercel 배포에서 `next/image` 온디맨드 변환은 Image Optimization 사용량으로 과금된다. 트래픽이 커지면 커스텀 `loader`로 CDN 변환 파이프라인에 위임하거나 빌드 타임 변환을 검토한다.

## 5. 미정

- `TODO(✍️)`: 캐릭터 PNG 원본 해상도 축소 여부 — 디자이너 확인 필요 (에셋 진실 소스는 Figma)
- `TODO(✍️)`: `og-image.png` 재생성 담당·규격 확정
