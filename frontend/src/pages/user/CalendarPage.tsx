// src/pages/user/CalendarPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, Badge, cn } from "@/app/DesignSystem";
import { RefreshCw, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { sessionApi } from "@/lib/http";
import { outfitRepo } from "@/lib/repo/outfitRepo";
import {MonthlyHistoryDto, TodayOutfitItemDto, RecoStrategy, outfitApi} from "@/lib/api/outfitApi";

import { useAppDispatch, useAppSelector } from "@/state/hooks/hooks";
import { fetchFavorites, optimisticSet, toggleFavorite } from "@/state/favorites/favoritesSlice";

/** ---------- types (UI) ---------- */
type ClothesSummaryItem = {
    clothingId: number;
    name: string;
    imageUrl?: string | null;
    category?: string | null;
};

type DayItemUI = {
    clothingId: number;
    sortOrder: number;
    name?: string;
    imageUrl?: string;
    category?: string;
    favorited?: boolean;
};

type DayUI = {
    dateISO: string; // YYYY-MM-DD
    items: DayItemUI[];
    feedbackScore: -1 | 0 | 1 | null;
    weatherTemp: number | null;
    condition: string | null;
    weatherFeelsLike: number | null;
    weatherCloudAmount: number | null;
    recoStrategy: RecoStrategy | null;
};

type LoadStatus = "idle" | "loading" | "error";

/** ---------- date utils (no lib) ---------- */
function pad2(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
}
function toISODate(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fromISODate(iso: string): Date {
    const [y, m, day] = iso.split("-").map((v) => parseInt(v, 10));
    return new Date(y, (m ?? 1) - 1, day ?? 1);
}
function sameMonth(a: Date, y: number, m1to12: number) {
    return a.getFullYear() === y && a.getMonth() === m1to12 - 1;
}
function startOfMonth(year: number, month1to12: number) {
    return new Date(year, month1to12 - 1, 1);
}
function daysInMonth(year: number, month1to12: number) {
    return new Date(year, month1to12, 0).getDate();
}
function toKoreanDateLabel(iso: string): string {
    const [y, m, d] = iso.split("-").map((v) => parseInt(v, 10));
    if (!y || !m || !d) return iso;
    return `${y}년 ${m}월 ${d}일`;
}

/** ---------- icons / labels ---------- */
function weatherIcon(cond: string | null): string {
    const c = (cond ?? "").toLowerCase();
    if (c.includes("rain") || c.includes("비")) return "🌧️";
    if (c.includes("snow") || c.includes("눈")) return "❄️";
    if (c.includes("cloud") || c.includes("흐림") || c.includes("clouds") || c.includes("구름")) return "☁️";
    if (c.includes("sun") || c.includes("맑") || c.includes("clear")) return "☀️";
    return "🌤️";
}
function recoMeta(strategy: RecoStrategy | null): { emoji: string; label: string; tooltip: string } {
    if (strategy === "BLEND_RATIO") return { emoji: "🧩", label: "혼용률", tooltip: "" };
    if (strategy === "MATERIAL_RATIO") return { emoji: "🧵", label: "소재", tooltip: "" };
    return { emoji: "⚙️", label: "기본", tooltip: "" };
}
function clampFeedback(v: unknown): -1 | 0 | 1 | null {
    if (v === 1 || v === 0 || v === -1) return v;
    return null;
}
function toRecoStrategy(v: unknown): RecoStrategy | null {
    if (v === "BLEND_RATIO" || v === "MATERIAL_RATIO") return v;
    return null;
}
function feedbackEmoji(score: -1 | 0 | 1 | null | undefined): string | null {
    if (score === 1) return "👍";
    if (score === 0) return "😐";
    if (score === -1) return "👎";
    return null;
}

/** ---------- API helper: clothes summary ---------- */
async function fetchClothesSummary(ids: number[]): Promise<ClothesSummaryItem[]> {
    if (!ids.length) return [];
    return sessionApi.post<ClothesSummaryItem[]>("/api/clothes/summary", { ids });
}

/** ---------- assemble monthly -> UI map (merge clothes summary) ---------- */
function buildDayMap(monthly: MonthlyHistoryDto, summaryList: ClothesSummaryItem[], favoriteSet: Set<number>): Map<string, DayUI> {
    const summaryMap = new Map<number, ClothesSummaryItem>();
    for (const s of summaryList) summaryMap.set(s.clothingId, s);

    const map = new Map<string, DayUI>();
    const days = Array.isArray((monthly as any)?.days) ? (monthly as any).days : [];

    for (const d of days) {
        const dateISO = typeof d?.date === "string" ? d.date.slice(0, 10) : "1970-01-01";
        const rawItems: TodayOutfitItemDto[] = Array.isArray(d?.items) ? d.items : [];

        const items: DayItemUI[] = rawItems
            .map((it) => {
                const base = summaryMap.get(it.clothingId);
                const mergedName = it?.name ?? base?.name;
                const mergedImg = it?.imageUrl ?? (base?.imageUrl ?? undefined);
                const mergedCat = it?.category ?? (base?.category ?? undefined);

                return {
                    clothingId: it.clothingId,
                    sortOrder: typeof it.sortOrder === "number" ? it.sortOrder : 999,
                    name: mergedName,
                    imageUrl: mergedImg || undefined,
                    category: mergedCat || undefined,
                    favorited: favoriteSet.has(it.clothingId),
                };
            })
            .sort((a, b) => a.sortOrder - b.sortOrder);

        map.set(dateISO, {
            dateISO,
            items,
            feedbackScore: clampFeedback(d?.feedbackScore),
            weatherTemp: typeof d?.weatherTemp === "number" ? d.weatherTemp : null,
            condition: typeof d?.condition === "string" ? d.condition : null,
            weatherFeelsLike: typeof d?.weatherFeelsLike === "number" ? d.weatherFeelsLike : null,
            weatherCloudAmount: typeof d?.weatherCloudAmount === "number" ? d.weatherCloudAmount : null,
            recoStrategy: toRecoStrategy(d?.recoStrategy),
        });
    }

    return map;
}

/** ---------- Calendar grid builder ---------- */
type Cell = { key: string; date: Date; inMonth: boolean };

function buildCalendarCells(year: number, month1to12: number): Cell[] {
    const first = startOfMonth(year, month1to12);
    const firstDow = first.getDay(); // 0=Sun
    const totalDays = daysInMonth(year, month1to12);

    const cells: Cell[] = [];

    for (let i = firstDow - 1; i >= 0; i--) {
        const d = new Date(year, month1to12 - 1, 1 - (i + 1));
        cells.push({ key: `p-${i}`, date: d, inMonth: false });
    }
    for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month1to12 - 1, day);
        cells.push({ key: `c-${day}`, date: d, inMonth: true });
    }
    while (cells.length < 42) {
        const last = cells[cells.length - 1].date;
        const next = new Date(last);
        next.setDate(last.getDate() + 1);
        cells.push({ key: `n-${cells.length}`, date: next, inMonth: false });
    }

    return cells;
}


/** ---------- main page ---------- */
export default function CalendarPage() {
    const dispatch = useAppDispatch();
    const favoriteIds = useAppSelector((s: any) => (Array.isArray(s?.favorites?.ids) ? s.favorites.ids : [])) as number[];
    const favoriteSet = useMemo(() => new Set<number>(favoriteIds), [favoriteIds]);

    const [sp, setSp] = useSearchParams();

    const todayISO = useMemo(() => toISODate(new Date()), []);
    const initialSelectedISO = useMemo(() => sp.get("date") ?? todayISO, [sp, todayISO]);
    const initialSelected = useMemo(() => fromISODate(initialSelectedISO), [initialSelectedISO]);

    const [viewYear, setViewYear] = useState<number>(initialSelected.getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(initialSelected.getMonth() + 1); // 1..12
    const [selectedISO, setSelectedISO] = useState<string>(initialSelectedISO);

    const [status, setStatus] = useState<LoadStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [dayMap, setDayMap] = useState<Map<string, DayUI>>(new Map());

    useEffect(() => {
        const sel = fromISODate(selectedISO);
        if (!sameMonth(sel, viewYear, viewMonth)) {
            const next = startOfMonth(viewYear, viewMonth);
            const nextISO = toISODate(next);
            setSelectedISO(nextISO);
            setSp((prev) => {
                prev.set("date", nextISO);
                return prev;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewYear, viewMonth]);

    useEffect(() => {
        dispatch(fetchFavorites());
    }, [dispatch]);

    const loadMonthly = useCallback(async () => {
        setStatus("loading");
        setError(null);
        try {
            const monthly = await outfitRepo.getMonthlyOutfits(viewYear, viewMonth);

            const ids: number[] = [];
            for (const d of monthly.days ?? []) {
                const items = Array.isArray(d?.items) ? d.items : [];
                for (const it of items) if (typeof it?.clothingId === "number") ids.push(it.clothingId);
            }
            const uniq = Array.from(new Set(ids));

            const summary = await fetchClothesSummary(uniq);
            const map = buildDayMap(monthly, summary, favoriteSet);
            setDayMap(map);

            setStatus("idle");
        } catch (e: any) {
            setStatus("error");
            setError(e?.message ?? "월 히스토리 로드 실패");
        }
    }, [viewYear, viewMonth, favoriteSet]);

    useEffect(() => {
        loadMonthly();
    }, [loadMonthly]);

    const selectedDay = useMemo(() => dayMap.get(selectedISO) ?? null, [dayMap, selectedISO]);
    const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
    const monthTitle = useMemo(() => `${viewYear}년 ${viewMonth}월`, [viewYear, viewMonth]);

    const onClickDay = useCallback(
        (iso: string) => {
            setSelectedISO(iso);
            setSp((prev) => {
                prev.set("date", iso);
                return prev;
            });
        },
        [setSp]
    );

    const onPrevMonth = useCallback(() => {
        const m = viewMonth - 1;
        if (m < 1) {
            setViewYear((y) => y - 1);
            setViewMonth(12);
        } else {
            setViewMonth(m);
        }
    }, [viewMonth]);

    const onNextMonth = useCallback(() => {
        const m = viewMonth + 1;
        if (m > 12) {
            setViewYear((y) => y + 1);
            setViewMonth(1);
        } else {
            setViewMonth(m);
        }
    }, [viewMonth]);

    const toggleFav = useCallback(
        (clothingId: number, next: boolean) => {
            dispatch(optimisticSet({ clothingId, next }));
            dispatch(toggleFavorite({ clothingId, next }));
        },
        [dispatch]
    );

    const navigate = useNavigate();
    const ROUTE_CHECKLIST = "/checklist";

    return (
        <div className="w-full">
            <div className="mx-auto max-w-[1200px] px-6 py-6">
                <div className={cn("grid gap-6", "grid-cols-[7fr_3fr]")}>
                    {/* LEFT: Calendar */}
                    <Card className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xs tracking-widest text-muted-foreground">HISTORY CALENDAR</div>
                                <div className="mt-2 text-2xl font-bold">{monthTitle}</div>
                            </div>

                            {/* month controls + refresh */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-12 w-12 p-0"
                                    onClick={onPrevMonth}
                                    aria-label="prev month"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-12 w-12 p-0"
                                    onClick={onNextMonth}
                                    aria-label="next month"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>

                            </div>
                        </div>

                        {/* weekday header */}
                        <div className="mt-6 grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground">
                            <div className="text-red-500">SUN</div>
                            <div>MON</div>
                            <div>TUE</div>
                            <div>WED</div>
                            <div>THU</div>
                            <div>FRI</div>
                            <div className="text-blue-500">SAT</div>
                        </div>

                        {/* calendar cells */}
                        <div className="mt-3 grid grid-cols-7 gap-3">
                            {cells.map((cell) => {
                                const iso = toISODate(cell.date);
                                const inMonth = cell.inMonth;
                                const dow = cell.date.getDay(); // 0=Sun, 6=Sat
                                const isToday = iso === todayISO;
                                const isSelected = iso === selectedISO;

                                const d = dayMap.get(iso);
                                const hasSaved = (d?.items?.length ?? 0) > 0;

                                // 마커는 "기록 있음"만 체크
                                const marker = hasSaved ? "✓" : null;

                                const dayColorClass =
                                    dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-slate-900";

                                return (
                                    <button
                                        key={cell.key}
                                        onClick={() => onClickDay(iso)}
                                        className={cn(
                                            "relative h-[74px] rounded-2xl border text-left transition",
                                            "bg-white hover:shadow-sm",
                                            !inMonth && "opacity-40",
                                            isSelected && "border-foreground",
                                            isToday && "bg-orange-50",
                                            "p-2"
                                        )}
                                    >
                                        {/* day number: 좌측 상단, 주말 색 반영 */}
                                        <div
                                            className={cn(
                                                "absolute left-2 top-2 text-base font-extrabold tracking-tight",
                                                dayColorClass,
                                                !inMonth && "text-muted-foreground"
                                            )}
                                        >
                                            {cell.date.getDate()}
                                        </div>

                                        {/* marker: 우측 상단, 주황색으로 강조 */}
                                        {marker && (
                                            <div
                                                className={cn(
                                                    "absolute right-2 top-2",
                                                    "h-6 min-w-6 rounded-full",
                                                    "flex items-center justify-center",
                                                    "bg-orange-500 border border-orange-500 text-white",
                                                    "text-sm font-bold shadow-sm"
                                                )}
                                                title="저장됨"
                                            >
                                                {marker}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {status === "error" && <div className="mt-4 text-sm text-red-600">{error ?? "로드 실패"}</div>}
                    </Card>

                    {/* RIGHT: Detail Panel */}
                    <Card className="!p-4">
                        {/* Selected date title */}
                        <div className="text-center">
                            <div className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
                                {toKoreanDateLabel(selectedISO)}
                            </div>
                        </div>

                        {/* KPI 3-up */}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {/* MACHINE */}
                            <div className="rounded-2xl border bg-white p-3">
                                <div className="text-[11px] font-medium text-slate-500">머신</div>
                                <div className="mt-1">
                                    {(() => {
                                        const s = selectedDay?.recoStrategy ?? null;
                                        const label = s === "MATERIAL_RATIO" ? "소재" : s === "BLEND_RATIO" ? "혼용률" : "기본";
                                        return <Badge className="rounded-full px-2 py-0.5 text-xs font-semibold">{label}</Badge>;
                                    })()}
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500">{recoMeta(selectedDay?.recoStrategy ?? null).tooltip}</div>
                            </div>

                            {/* WEATHER */}
                            <div className="rounded-2xl border bg-white p-3">
                                <div className="text-[11px] font-medium text-slate-500">날씨</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="text-xl leading-none">{weatherIcon(selectedDay?.condition ?? null)}</div>
                                    <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                                        {typeof selectedDay?.weatherTemp === "number" ? `${Math.round(selectedDay.weatherTemp)}°` : "—"}
                                    </div>
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500">{selectedDay?.condition ?? "—"}</div>
                            </div>

                            {/* FEEDBACK */}
                            <div className="rounded-2xl border bg-white p-3">
                                <div className="text-[11px] font-medium text-slate-500">피드백</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="text-xl leading-none">{feedbackEmoji(selectedDay?.feedbackScore ?? null) ?? "—"}</div>
                                    <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                                        {selectedDay?.feedbackScore === 1
                                            ? "좋음"
                                            : selectedDay?.feedbackScore === 0
                                                ? "보통"
                                                : selectedDay?.feedbackScore === -1
                                                    ? "나쁨"
                                                    : ""}
                                    </div>
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500">
                                    {feedbackEmoji(selectedDay?.feedbackScore ?? null) ? "작성됨" : "아직 없음"}
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="mt-4">
                            <div className="text-sm font-semibold text-slate-900">선택한 옷 조합</div>

                            {selectedDay?.items?.length ? (
                                <div className="mt-2 space-y-3">
                                    {(() => {
                                        const items = [...selectedDay.items].sort((a, b) => a.sortOrder - b.sortOrder);

                                        const pick = (slot: "TOP" | "BOTTOM" | "OUTER") => {
                                            const found = items.find((it) => (it.category ?? "").toUpperCase().includes(slot));
                                            return found ?? null;
                                        };

                                        const slots: Array<{ slot: "TOP" | "BOTTOM" | "OUTER"; emptyText: string }> = [
                                            { slot: "TOP", emptyText: "상의 없음" },
                                            { slot: "BOTTOM", emptyText: "하의 없음" },
                                            { slot: "OUTER", emptyText: "아우터 없음" },
                                        ];

                                        return slots.map(({ slot, emptyText }) => {
                                            const it = pick(slot);
                                            const isEmpty = !it;
                                            const clothingId = it?.clothingId ?? -1;
                                            const isFav = !isEmpty && favoriteSet.has(clothingId);

                                            return (
                                                <div
                                                    key={`${selectedISO}-${slot}-${clothingId}`}
                                                    className={cn("rounded-2xl border bg-white p-3", isEmpty && "border-dashed")}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        {/* LEFT: image */}
                                                        <div className="relative h-[76px] w-[76px] overflow-hidden rounded-2xl bg-slate-100 flex-none">
                                                            {!isEmpty && it?.imageUrl ? (
                                                                <img src={it.imageUrl} alt={it.name ?? "item"} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-[11px] text-slate-400">
                                                                    {isEmpty ? "EMPTY" : "NO IMG"}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* CENTER: category */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-[11px] font-medium text-slate-500">카테고리</div>
                                                            <div className={cn("mt-1 text-base font-semibold", isEmpty ? "text-slate-300" : "text-slate-900")}>
                                                                {isEmpty ? emptyText : it?.category ?? slot}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-12 w-12"
                                                            disabled={isEmpty}
                                                            onClick={() => !isEmpty && toggleFav(clothingId, !isFav)}
                                                            title={isEmpty ? "빈 슬롯" : isFav ? "좋아요 해제" : "좋아요"}
                                                        >
                                                            <Heart className={cn("h-6 w-6", isFav ? "text-red-500 fill-current" : "text-slate-400")} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : (
                                <div className="mt-2 rounded-2xl border bg-white p-4">
                                    <div className="text-sm font-semibold text-slate-900">기록 없음</div>
                                    <div className="mt-2 rounded-xl border bg-orange-50 p-3 text-sm text-slate-700">
                                        옷이 부족하면 추천 정확도가 떨어질 수 있어요. 먼저 체크리스트를 작성해 주세요.
                                    </div>
                                    <div className="mt-3">
                                        <Button className="w-full" onClick={() => navigate(ROUTE_CHECKLIST)}>
                                            체크리스트로
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}