"use client";

import type { ReactNode } from "react";

// 결과 뷰의 상태 3종(로딩 / 에러 / 생성 대기) 공용 껍데기.
// 세 화면이 "중앙 정렬 + 제목 + 보조문구 (+ 스피너 | 액션)" 같은 형태를 반복하고 있어 하나로 묶었다.
// product-spec #6 상태 3종 — 특히 이미지 생성 대기 표현이 중요하다.

interface ResultStatusScreenProps {
  /** 진행 중임을 알리는 스피너 노출 여부 */
  spinner?: boolean;
  title: string;
  description?: string;
  /** 재시도 CTA 등 */
  action?: ReactNode;
}

export function ResultStatusScreen({
  spinner = false,
  title,
  description,
  action,
}: ResultStatusScreenProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      {spinner && (
        <div
          role="status"
          aria-label="불러오는 중"
          className="size-10 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500"
        />
      )}
      <p className="text-body-16-medium text-gray-900">{title}</p>
      {description && (
        <p className="text-body-14-regular text-gray-300">{description}</p>
      )}
      {action}
    </div>
  );
}
