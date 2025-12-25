import React from "react";

type LoadingStateProps = {
  title?: string;
  description?: string;
  /**
   * skeleton 카드 개수
   */
  skeletonCount?: number;
  className?: string;
};

export default function LoadingState({
  title = "불러오는 중…",
  description = "데이터를 가져오고 있습니다.",
  skeletonCount = 3,
  className,
}: LoadingStateProps) {
  return (
    <div className={className}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="h-28 w-full animate-pulse rounded-xl bg-slate-100" />
                  <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}