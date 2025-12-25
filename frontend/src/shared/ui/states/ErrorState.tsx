import React from "react";

type ErrorStateProps = {
  title?: string;
  description?: string;
  /**
   * 기본 버튼 라벨
   */
  actionLabel?: string;
  /**
   * 버튼 클릭 핸들러 (예: 재시도)
   */
  onAction?: () => void;
  /**
   * 보조 액션(선택)
   */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /**
   * 추가 정보(에러코드/요청ID 등)
   */
  meta?: string;
  className?: string;
};

export default function ErrorState({
  title = "문제가 발생했습니다",
  description = "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  actionLabel = "다시 시도",
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  meta,
  className,
}: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">
            <span className="text-rose-600 text-xl leading-none">!</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>

            {meta ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {meta}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 active:bg-slate-900"
              >
                {actionLabel}
              </button>

              {secondaryActionLabel ? (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {secondaryActionLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}