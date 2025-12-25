import React from "react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /**
   * 예: "옷을 먼저 등록하면 추천이 가능합니다"
   */
  hint?: string;
  className?: string;
};

export default function EmptyState({
  title = "데이터가 없습니다",
  description = "현재 표시할 항목이 없습니다.",
  actionLabel,
  onAction,
  hint,
  className,
}: EmptyStateProps) {
  return (
    <div className={className}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <span className="text-slate-700 text-lg leading-none">•</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>

            {hint ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {hint}
              </div>
            ) : null}

            {actionLabel ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onAction}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {actionLabel}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}