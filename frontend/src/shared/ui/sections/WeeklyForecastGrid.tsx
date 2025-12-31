import React from "react";
import type { WeeklyForecastItem } from "@/shared/domain/weather";
import { skyEmoji, skyLabelKo } from "@/shared/domain/weather";

type Props = {
  weekly?: WeeklyForecastItem[];
  title?: string;
  clamp?: number;
  emptyText?: string;
  className?: string;
};

const sortAndClamp = (weekly: WeeklyForecastItem[] | undefined, clamp: number) => {
  if (!weekly?.length) return [];
  const sorted = [...weekly].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(0, clamp);
};

const WeeklyForecastGrid: React.FC<Props> = ({
                                               weekly,
                                               title = "이번 주 예보",
                                               clamp = 7,
                                               emptyText = "주간 예보 데이터가 없습니다.",
                                               className,
                                             }) => {
  const items = sortAndClamp(weekly, clamp);

  return (
      <div className={className}>
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          {title} ({clamp}일)
        </div>

        {!items.length ? (
            <div className="text-sm text-slate-400 font-bold">{emptyText}</div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {items.map((d) => (
                  <div key={d.date} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-navy-900">{d.dayLabel}</div>
                      <div className="text-xl">{d.icon || skyEmoji(d.sky)}</div>
                    </div>

                    <div className="mt-2 text-[10px] font-bold text-slate-400">{d.date}</div>

                    <div className="mt-3 text-sm font-black text-navy-900">
                      {d.min}° / {d.max}°
                    </div>

                    <div className="mt-1 text-[10px] font-bold text-slate-500">
                      {skyLabelKo(d.sky)} · 강수 {d.pop}%
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

export default WeeklyForecastGrid;