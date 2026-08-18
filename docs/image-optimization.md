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

### ① `og-image.png` 1.2MB — `next/image`를 거치지 않는다

OG 이미지는 크롤러가 `<meta>`의 URL로 **원본을 직접** 가져간다. `next/image`의 자동 변환 대상이 아니므로 위 최적화가 하나도 적용되지 않는다. **원본 자체를 줄여야 하는 유일한 케이스**다.

- 권장 규격: 1200×630
- 카카오톡·인스타 공유가 핵심 유입 경로라 **미리보기 로딩 속도가 곧 전환율**이다.

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
