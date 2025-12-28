// src/pages/user/CalendarPage.tsx
import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Badge, SectionHeader, cn } from "@/app/DesignSystem";
import { ChevronLeft, ChevronRight, Filter, Download, X } from "lucide-react";
import { MOCK_HISTORY } from "@/shared/ui/mock";

type HistoryEntryUI = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  title: string;
  weatherTemp: number;
  weatherIcon: string; // emoji or text
  feedback?: string;
  images: string[];
};

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMonthTitle(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function weatherIconFromCondition(cond?: string) {
  const c = (cond ?? "").toLowerCase();
  if (c.includes("rain") || c.includes("비")) return "🌧️";
  if (c.includes("snow") || c.includes("눈")) return "❄️";
  if (c.includes("cloud") || c.includes("흐림") || c.includes("구름")) return "☁️";
  if (c.includes("sun") || c.includes("맑")) return "☀️";
  return "🌤️";
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

function toHistoryEntryUI(raw: any, idx: number): HistoryEntryUI {
  const id = String(raw?.id ?? raw?.historyId ?? `h-${idx}`);
  const dateISO = String(raw?.date ?? raw?.weatherDate ?? raw?.createdAt ?? "2025-12-28").slice(0, 10);
  const title = String(raw?.styleName ?? raw?.style ?? raw?.title ?? raw?.note ?? "선택된 옷");

  const weatherTemp = Number(raw?.weatherTemp ?? raw?.weather?.temp ?? raw?.weather?.temperature ?? 0);

  const weatherIcon = String(
    raw?.weatherIcon ?? weatherIconFromCondition(raw?.weather?.condition ?? raw?.weather?.description)
  );

  const feedback =
    String(raw?.feedback ?? raw?.feedbackShort ?? raw?.comment ?? raw?.memo ?? raw?.note ?? "").trim() || undefined;

  const imagesFromRaw =
    Array.isArray(raw?.images)
      ? raw.images
      : Array.isArray(raw?.items)
      ? raw.items.map((it: any) => it?.imageUrl).filter(Boolean)
      : Array.isArray(raw?.outfit)
      ? raw.outfit.map((it: any) => it?.imageUrl).filter(Boolean)
      : [];

  const images = imagesFromRaw.filter(Boolean).slice(0, 3);

  return { id, dateISO, title, weatherTemp, weatherIcon, feedback, images };
}

function OutfitModal({
  open,
  onClose,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  entry: HistoryEntryUI | null;
}) {
  if (!open || !entry) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(920px,92vw)] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-[28px] bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-400 tracking-widest">{entry.dateISO}</div>
              <div className="text-xl font-black text-[#0F172A] truncate">{entry.title}</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600">
                <span className="text-lg">{entry.weatherIcon}</span>
                <span>{entry.weatherTemp}°C</span>
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

          <div className="p-6 space-y-5">
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
                  이미지가 없습니다. (실데이터 연결 시 item 이미지 URL이 들어오면 자동으로 채워집니다)
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

  const [base, setBase] = useState(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const [y, m, d] = dateParam.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const [selected, setSelected] = useState<HistoryEntryUI | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const historyEntries = useMemo(() => {
    const arr = Array.isArray(MOCK_HISTORY) ? MOCK_HISTORY : [];
    return arr.map(toHistoryEntryUI);
  }, []);

  const historyMap = useMemo(() => {
    const m = new Map<string, HistoryEntryUI>();
    for (const e of historyEntries) m.set(e.dateISO, e);
    return m;
  }, [historyEntries]);

  const grid = useMemo(() => buildCalendarGrid(base), [base]);

  const openModal = (entry: HistoryEntryUI) => {
    setSelected(entry);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionHeader
          title="OOTD 캘린더"
          subtitle="기록된 날만 표시됩니다. 기록된 날짜를 클릭하면 상세 모달로 확인할 수 있어요."
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

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-navy-900">{formatMonthTitle(base)}</h2>
          <Badge variant="outline">달력</Badge>
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
        {/* day labels: SUN red, SAT blue */}
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

        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const iso = toISO(d);
            const entry = historyMap.get(iso);
            const isCurrentMonth = d.getMonth() === base.getMonth();
            const dow = d.getDay(); // 0 sun, 6 sat

            return (
              <div
                key={iso + i}
                className={cn(
                  "min-h-[148px] border-r border-b border-slate-50 p-3 transition-all",
                  entry ? "hover:bg-slate-50" : "bg-transparent",
                  i % 7 === 6 && "border-r-0",
                  !isCurrentMonth && "bg-slate-50/40"
                )}
              >
                {/* date number + 기록 도트(기록된 날만 주황색 동그라미) */}
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "text-sm font-black",
                      !isCurrentMonth && "text-slate-300",
                      isCurrentMonth && dow === 0 && "text-red-500",
                      isCurrentMonth && dow === 6 && "text-blue-500",
                      isCurrentMonth && dow !== 0 && dow !== 6 && "text-slate-600"
                    )}
                  >
                    {d.getDate()}
                  </div>

                  {entry ? (
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500"
                      aria-label="기록 있음"
                      title="기록 있음"
                    />
                  ) : (
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-transparent" />
                  )}
                </div>

                {/* 기록이 있는 날만 카드 표시 / 기록 없는 날은 아무 텍스트도 안 보여줌 */}
                {entry ? (
                  <button
                    type="button"
                    onClick={() => openModal(entry)}
                    className="mt-2 w-full text-left rounded-2xl border border-slate-200 bg-white hover:shadow-sm transition p-3"
                    aria-label={`${iso} 기록 보기`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-[#0F172A] truncate">{entry.title}</div>
                      <div className="flex items-center gap-1 text-xs font-black text-slate-500 shrink-0">
                        <span className="text-sm">{entry.weatherIcon}</span>
                        <span>{entry.weatherTemp}°</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] font-bold text-slate-500 line-clamp-2">
                      {entry.feedback ?? "피드백 없음"}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {entry.images.length > 0 ? (
                        entry.images.slice(0, 3).map((src, idx2) => (
                          <div
                            key={src + idx2}
                            className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                          >
                            <img src={src} alt="thumb" className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-400">
                          이미지 없음
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-[11px] font-black text-slate-400">클릭해서 상세 보기</div>
                  </button>
                ) : (
                  <div className="mt-3" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <OutfitModal open={modalOpen} onClose={() => setModalOpen(false)} entry={selected} />
    </div>
  );
}