"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

// playground 공용 프리미티브.
//
// 설계 원칙 — 토큰 값을 이 파일에 적지 않는다:
//   /style-guide 는 hex를 하드코딩해서 @theme 에 토큰이 늘어도 화면이 따라오지 못했다
//   (blue-900·pink-300·yellow-*·green-*·kakao 누락). 여기서는 브라우저가 계산한
//   실제 CSS 변수 값을 읽어 표시하므로 문서와 구현이 갈라질 수 없다.
//   토큰 값의 진실 소스는 Figma → @theme (design-guide.md §0).

/** 섹션 컨테이너 — 앵커 이동 대상 */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-4 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display2 text-head2-20 text-gray-900">{title}</h2>
        {description && (
          <p className="text-body-14-regular text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/** 섹션 내부 소그룹 */
export function SubGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption-12-medium text-gray-400">{label}</p>
      {children}
    </div>
  );
}

/**
 * CSS 변수의 계산값을 읽어 표시한다.
 * 하드코딩 대신 런타임 조회 → @theme 이 바뀌면 화면도 자동으로 바뀐다.
 */
export function TokenValue({ varName }: { varName: string }) {
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    setValue(raw);
  }, [varName]);

  return (
    <span className="text-caption-12-regular text-gray-300 tabular-nums">
      {value || "—"}
    </span>
  );
}

/** 컴포넌트 예시 한 칸 — 무엇을 언제 쓰는지까지 적는다 */
export function SpecRow({
  name,
  usage,
  children,
}: {
  name: string;
  /** 언제 쓰는 variant인지 — 임의 변형을 막는 근거 (design-guide.md §3) */
  usage?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-field border border-gray-100 bg-white p-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-body-14-medium text-gray-900">{name}</p>
        {usage && (
          <p className="text-caption-12-regular text-gray-300">{usage}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

/** 주의·미확정 사항 배너 */
export function SpecNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-field bg-yellow-200 px-3 py-2 text-caption-12-regular text-yellow-800">
      {children}
    </p>
  );
}
