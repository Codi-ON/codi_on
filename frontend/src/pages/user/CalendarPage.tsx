// src/pages/user/CalendarPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Button, Badge, SectionHeader, cn } from "@/app/DesignSystem";
import { ChevronLeft, ChevronRight, Filter, Download, X } from "lucide-react";

import { outfitApi, type TodayOutfitDto } from "@/lib/api/outfitApi";
import { outfitAdapter, type HistoryEntryUI, type SelectedOutfit } from "@/lib/adapters/outfitAdapter";

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMonthTitle(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

// 6*7 달력 그리드 (전월/익월 포함)
function buildCalendarGrid(base: Date) {
  const year = base.getFullYear();
  const month = base.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0=SUN
  const gridStart = new Date(year, month, 1 - startDow);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function Drawer({
                  open,
                  entry,
                  onClose,
                }: {
  open: boolean;
  entry: HistoryEntryUI | null;
  onClose: () => void;
}) {
  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const show = open && !!entry;

  return (
      <div
          className={cn(
              "fixed inset-0 z-[999] transition",
              show ? "pointer-events-auto" : "pointer-events-none"
          )}
          aria-hidden={!show}
      >
        {/* backdrop */}
        <div
            className={cn(
                "absolute inset-0 bg-black/40 transition-opacity",
                show ? "opacity-100" : "opacity-0"
            )}
            onClick={onClose}
        />

        {/* panel */}
        <aside
            className={cn(
                "absolute right-0 top-0 h-full w-[min(520px,92vw)] bg-white border-l border-slate-200 shadow-2xl transition-transform",
                show ? "translate-x-0" : "translate-x-full"
            )}
            role="dialog"
            aria-modal="true"
        >
          {entry && (
              <div className="h-full flex flex-col">
                {/* header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-400 tracking-widest">{entry.dateISO}</div>
                      <div className="mt-1 text-2xl font-black text-[#0F172A] truncate">{entry.title}</div>

                      <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600">
                        <span className="text-lg">{entry.weatherIcon}</span>
                        <span>{entry.weatherTemp == null ? "-" : `${entry.weatherTemp}°C`}</span>
                        {entry.feedback ? <Badge variant="orange">피드백</Badge> : <Badge variant="outline">피드백 없음</Badge>}
                      </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-xl p-2 hover:bg-slate-50 border border-slate-200"
                        aria-label="닫기"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* body */}
                <div className="flex-1 overflow-auto p-6 space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-black text-slate-500">그날 피드백</div>
                    <div className="mt-2 text-sm font-bold text-[#0F172A]">
                      {entry.feedback ?? "아직 피드백 데이터가 없습니다."}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-black text-slate-500 mb-2">착장 아이템</div>

                    {entry.images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {entry.images.map((src, i) => (
                              <div
                                  key={src + i}
                                  className="aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
                              >
                                <img src={src} alt="outfit" className="w-full h-full object-cover" />
                              </div>
                          ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-400">
                          이미지가 없습니다. (백에서 imageUrl 내려오면 자동 반영)
                        </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                      닫기
                    </Button>
                  </div>
                </div>
              </div>
          )}
        </aside>
      </div>
  );
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type CalendarLocationState = {
  recentlySaved?: TodayOutfitDto | null;
  selectedOutfit?: SelectedOutfit | null;
};

type DayCellProps = {
  date: Date;
  baseMonth: number;
  entry?: HistoryEntryUI;
  onSelect: (entry: HistoryEntryUI) => void;
};

const DayCell = React.memo(function DayCell({ date, baseMonth, entry, onSelect }: DayCellProps) {
  const iso = toISO(date);
  const isCurrentMonth = date.getMonth() === baseMonth;
  const dow = date.getDay();

  const headTextClass = cn(
      "text-sm font-black",
      !isCurrentMonth && "text-slate-300",
      isCurrentMonth && dow === 0 && "text-red-500",
      isCurrentMonth && dow === 6 && "text-blue-500",
      isCurrentMonth && dow !== 0 && dow !== 6 && "text-slate-600"
  );

  // ✅ “신호만”: dot + (옵션)날씨 아이콘 + (옵션)피드백 신호
  const Signal = () => (
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" aria-label="기록 있음" />
        <span className="text-sm">{entry?.weatherIcon}</span>
        <span
            className={cn(
                "inline-block w-2 h-2 rounded-full",
                entry?.feedback ? "bg-emerald-500" : "bg-slate-200"
            )}
            aria-label={entry?.feedback ? "피드백 있음" : "피드백 없음"}
        />
      </div>
  );

  return (
      <div
          className={cn(
              "min-h-[128px] border-r border-b border-slate-50 p-3 transition-all",
              !isCurrentMonth && "bg-slate-50/40"
          )}
      >
        <div className="flex items-center justify-between">
          <div className={headTextClass}>{date.getDate()}</div>

          {/* 기록 있으면 우측 상단에도 dot 하나 */}
          {entry ? (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" aria-label="기록 있음" />
          ) : (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-transparent" />
          )}
        </div>

        {entry ? (
            <button
                type="button"
                onClick={() => onSelect(entry)}
                className={cn(
                    "mt-3 w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition p-3 text-left",
                    "focus:outline-none focus:ring-2 focus:ring-orange-200"
                )}
                aria-label={`${iso} 기록 상세 보기`}
            >
              <Signal />
              <div className="mt-3 text-[11px] font-black text-slate-400">클릭해서 상세 보기</div>
            </button>
        ) : (
            <div className="mt-3 h-[72px]" />
        )}
      </div>
  );
});

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

  const { state } = useLocation() as { state?: CalendarLocationState };
  const recentlySaved = state?.recentlySaved ?? null;
  const selectedOutfit = state?.selectedOutfit ?? null;

  const [base, setBase] = useState(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const [y, m, d] = dateParam.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const year = base.getFullYear();
  const month = base.getMonth() + 1;
  const baseMonth = base.getMonth();

  const grid = useMemo(() => buildCalendarGrid(base), [base]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyMap, setHistoryMap] = useState<Map<string, HistoryEntryUI>>(new Map());

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntryUI | null>(null);

  const openDrawer = useCallback((entry: HistoryEntryUI) => {
    setSelectedEntry(entry);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // ✅ 월 데이터 로드 (DTO -> UI는 adapter에서만)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const monthly = await outfitApi.getMonthly(year, month);
        const map = outfitAdapter.monthlyToMap(monthly);

        // ✅ recentlySaved는 “?date와 무관하게” 항상 노출 가능하도록 map에 merge
        const merged = outfitAdapter.mergeRecentlySaved(map, recentlySaved, selectedOutfit);

        if (mounted) setHistoryMap(merged);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "월 히스토리를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [year, month, recentlySaved, selectedOutfit]);

  // 월 이동 시 열린 패널은 닫고, 선택은 유지(원하면 null로 바꾸면 됨)
  useEffect(() => {
    setDrawerOpen(false);
  }, [year, month]);

  return (
      <div className="space-y-6 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <SectionHeader
              title="OOTD 캘린더"
              subtitle="기록된 날에만 신호가 표시됩니다. 날짜를 클릭하면 우측 패널에서 상세를 확인할 수 있어요."
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={Filter}>
              필터
            </Button>
            <Button variant="outline" size="sm" icon={Download}>
              내보내기
            </Button>
          </div>
        </div>

        {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
        )}

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-navy-900">{formatMonthTitle(base)}</h2>
            {loading ? <Badge variant="slate">로딩 중</Badge> : <Badge variant="outline">달력</Badge>}
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl">
            <button
                type="button"
                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1))}
                aria-label="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <button
                type="button"
                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1))}
                aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
          {/* day labels */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAY_LABELS.map((d, idx) => (
                <div
                    key={d}
                    className={cn(
                        "py-4 text-center text-[10px] font-black tracking-widest",
                        idx === 0 && "text-red-500",
                        idx === 6 && "text-blue-500",
                        idx !== 0 && idx !== 6 && "text-slate-400"
                    )}
                >
                  {d}
                </div>
            ))}
          </div>

          {/* cells */}
          <div className="grid grid-cols-7">
            {grid.map((d, i) => {
              const iso = toISO(d);
              const entry = historyMap.get(iso);

              return (
                  <div key={iso + i} className={cn(i % 7 === 6 && "border-r-0")}>
                    <DayCell date={d} baseMonth={baseMonth} entry={entry} onSelect={openDrawer} />
                  </div>
              );
            })}
          </div>
        </div>

        {/* 우측 드로어 */}
        <Drawer open={drawerOpen} entry={selectedEntry} onClose={closeDrawer} />
      </div>
  );
}