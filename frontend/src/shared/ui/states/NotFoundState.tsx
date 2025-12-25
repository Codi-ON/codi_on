import React from "react";

type NotFoundStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export default function NotFoundState({
  title = "페이지를 찾을 수 없습니다",
  description = "요청하신 주소가 올바른지 확인해 주세요.",
  actionLabel = "홈으로",
  onAction,
  className,
}: NotFoundStateProps) {
  return (
    <div className={className}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <span className="text-slate-800 text-sm font-black">404</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {actionLabel}
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                뒤로가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}