"use client";

import { Dialog } from "radix-ui";

import { Cta } from "@/components/ui/cta";

// 확인 모달 — 이탈 가드 등 "정말 ~할까요?" 분기에 쓰는 공용 confirm.
// radix Dialog 기반(포커스 트랩·Esc·aria-modal 내장). Esc/바깥 클릭 = 취소(머무르기).
// figma-loose: 디자이너 모달 프레임 대기 → 토큰 기반 중립 스타일. 합의되면 교체.
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** 머무르기(취소·주 버튼) 라벨 */
  cancelLabel: string;
  /** 나가기(진행·보조 버튼) 라벨 */
  confirmLabel: string;
  /** 진행(나가기) 선택 시 */
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white px-6 pb-6 pt-7 text-center shadow-xl focus:outline-none">
          <Dialog.Title className="text-head1-18 font-display1 text-gray-900">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-body-14-regular text-gray-300">
              {description}
            </Dialog.Description>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {/* 주 버튼 = 머무르기(안전) */}
            <Cta onClick={() => onOpenChange(false)}>{cancelLabel}</Cta>
            {/* 보조 버튼 = 나가기 */}
            <button
              type="button"
              onClick={onConfirm}
              className="h-12 rounded-cta text-body-16-medium text-gray-300 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 active:text-gray-900"
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
