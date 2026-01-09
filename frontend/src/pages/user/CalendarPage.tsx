// src/pages/user/CalendarPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Card, Badge, Button, cn } from "@/app/DesignSystem";
import { RefreshCw } from "lucide-react";

import { outfitRepo } from "@/lib/repo/outfitRepo";
import { outfitAdapter, type HistoryEntryUI, type SelectedOutfit } from "@/lib/adapters/outfitAdapter";
import type { MonthlyHistoryDto, TodayOutfitDto, TodayOutfitItemDto } from "@/lib/api/outfitApi";

import { useAppSelector } from "@/state/hooks/hooks";

const GUIDE_TOAST_KEY = "codion.calendar.guideToastShown.v2";

// -----------------------------
// date helpers
// -----------------------------
function isoTodayLocal(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function parseISO(s: string): Date {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// 캘린더 매트릭스(6주=42칸 고정)
function buildMonthMatrix(year: number, month1to12: number) {
    const first = new Date(year, month1to12 - 1, 1);
    const startDay = first.getDay(); // 0 Sun
    const daysInMonth = new Date(year, month1to12, 0).getDate();

    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    // 앞쪽 채우기
    for (let i = 0; i < startDay; i++) {
        const d = new Date(year, month1to12 - 1, 1 - (startDay - i));
        cells.push({ date: d, inMonth: false });
    }

    // 본월
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push({ date: new Date(year, month1to12 - 1, day), inMonth: true });
    }

    // 뒤쪽 채우기 (42칸 맞추기)
    while (cells.length < 42) {
        const last = cells[cells.length - 1].date;
        const next = new Date(last);
        next.setDate(last.getDate() + 1);
        cells.push({ date: next, inMonth: false });
    }

    return cells;
}

function fmtTemp(v: number | null | undefined): string {
    if (typeof v !== "number" || Number.isNaN(v)) return "-";
    return `${v.toFixed(1)}°`;
}

// -----------------------------
// UI parts
// -----------------------------
function StampCheck() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[56px] h-[56px] rotate-[-12deg]">
                <div className="absolute inset-0 rounded-full border-[3px] border-orange-500" />
                <div className="absolute inset-[8px] rounded-full border-[1px] border-orange-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-black tracking-widest text-orange-600">CHECK</span>
                </div>
            </div>
        </div>
    );
}

function OutfitRow({
                       item,
                       favorited,
                       scorePercent,
                   }: {
    item: TodayOutfitItemDto;
    favorited?: boolean;
    scorePercent?: number | null; // 0~100
}) {
    const scoreText =
        typeof scorePercent === "number" && !Number.isNaN(scorePercent) ? `${Math.round(scorePercent)}%` : "-";

    return (
        <div className="rounded-[18px] border border-slate-100 bg-white px-4 py-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={`clothing-${item.clothingId}`} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[10px] font-black text-slate-300">NO IMG</span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-slate-300 tracking-widest uppercase">
                    ID {item.clothingId} · SORT {item.sortOrder}
                </div>
                <div className="mt-0.5 text-sm font-black text-navy-900 truncate">저장된 아이템</div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <div className="h-9 px-3 rounded-full border flex items-center gap-2 border-slate-200 bg-white" aria-label="fit-score">
                    <span className="text-[11px] font-black text-slate-500">적합도</span>
                    <span className="text-[11px] font-black text-orange-600">{scoreText}</span>
                </div>

                <div
                    className={cn(
                        "w-9 h-9 rounded-full border flex items-center justify-center",
                        favorited ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white"
                    )}
                    aria-label={favorited ? "favorited" : "not-favorited"}
                    title={favorited ? "찜" : "미찜"}
                >
                    <span className={cn("text-base", favorited ? "" : "opacity-40")}>♥</span>
                </div>
            </div>
        </div>
    );
}

// -----------------------------
// Page
// -----------------------------
type CalendarNavState = {
    recentlySaved?: TodayOutfitDto | null;
    selectedOutfit?: SelectedOutfit | null;
};

const CalendarPage: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const location = useLocation();

    // ✅ navigate state(저장 직후 즉시 반영용)
    const navState = (location.state ?? {}) as CalendarNavState;
    const recentlySavedFromNav = navState?.recentlySaved ?? null;
    const selectedOutfitFromNav = navState?.selectedOutfit ?? null;

    const initialDate = params.get("date") ?? isoTodayLocal();
    const [selectedISO, setSelectedISO] = useState<string>(initialDate);

    const selectedDateObj = useMemo(() => parseISO(selectedISO), [selectedISO]);
    const viewYear = selectedDateObj.getFullYear();
    const viewMonth = selectedDateObj.getMonth() + 1;

    const todayISO = useMemo(() => isoTodayLocal(), []);

    // data
    const [monthly, setMonthly] = useState<MonthlyHistoryDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // guide toast
    const [showGuide, setShowGuide] = useState(false);

    // -----------------------------
    // Redux: favorites / score (slice 이름 반영)
    // -----------------------------
    const favoriteIds: number[] = useAppSelector((s: any) => {
        // favoritesSlice.ts가 ids든 items든 어떤 키든 방어 처리
        const v = s?.favorites?.ids ?? s?.favorites?.items ?? s?.favorites?.favoriteIds ?? [];
        return Array.isArray(v) ? v : [];
    });
    const favoriteSet = useMemo(() => new Set<number>(favoriteIds), [favoriteIds]);

    const scoreByIdObj = useAppSelector((s: any) => {
        // outfitRecoSlice.ts에서 스코어 맵을 아직 안 쓰면 빈 객체
        // (네 실제 키가 있으면 여기만 맞추면 됨)
        return s?.outfitReco?.scoreByClothingId ?? s?.outfitReco?.scoreMap ?? {};
    });
    const scoreMap = useMemo(() => {
        const m = new Map<number, number>();
        if (scoreByIdObj && typeof scoreByIdObj === "object") {
            for (const [k, v] of Object.entries(scoreByIdObj as Record<string, any>)) {
                const id = Number(k);
                const num = typeof v === "number" ? v : Number(v);
                if (!Number.isNaN(id) && typeof num === "number" && !Number.isNaN(num)) m.set(id, num);
            }
        }
        return m;
    }, [scoreByIdObj]);

    // -----------------------------
    // load monthly
    // -----------------------------
    const refresh = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const m = await outfitRepo.getMonthlyOutfits(viewYear, viewMonth);
            setMonthly(m);
        } catch (e: any) {
            setErr(e?.message ?? "데이터 로드 실패");
        } finally {
            setLoading(false);
        }
    }, [viewYear, viewMonth]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // guide once
    useEffect(() => {
        try {
            const shown = localStorage.getItem(GUIDE_TOAST_KEY);
            if (shown === "1") return;
            setShowGuide(true);
            localStorage.setItem(GUIDE_TOAST_KEY, "1");
            const t = window.setTimeout(() => setShowGuide(false), 3500);
            return () => window.clearTimeout(t);
        } catch {
            setShowGuide(true);
            const t = window.setTimeout(() => setShowGuide(false), 3500);
            return () => window.clearTimeout(t);
        }
    }, []);

    // -----------------------------
    // monthly -> map + recentlySaved merge
    // -----------------------------
    const monthlyMap = useMemo(() => {
        if (!monthly) return new Map<string, HistoryEntryUI>();

        const base = outfitAdapter.monthlyToMap(monthly);

        // ✅ 저장 직후 navigate state로 온 recentlySaved가 있으면 UI 즉시 반영
        // (monthly 집계/조회가 늦어도 캘린더는 바로 찍히게)
        if (recentlySavedFromNav?.date) {
            const iso = outfitAdapter.normalizeISO(recentlySavedFromNav.date);
            const ym = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
            if (iso.slice(0, 7) === ym) {
                return outfitAdapter.mergeRecentlySaved(base, recentlySavedFromNav, selectedOutfitFromNav);
            }
        }

        return base;
    }, [monthly, viewYear, viewMonth, recentlySavedFromNav, selectedOutfitFromNav]);

    const selectedEntry = useMemo(() => monthlyMap.get(selectedISO) ?? null, [monthlyMap, selectedISO]);

    // 오른쪽 리스트에 쓸 "선택 날짜 items" 결정
    const selectedItems: TodayOutfitItemDto[] = useMemo(() => {
        // 1) monthly에서 해당 날짜 day 찾기
        const day = (monthly?.days ?? []).find((d) => outfitAdapter.normalizeISO(d.date) === selectedISO);
        if (day?.items?.length) return day.items;

        // 2) monthly에 없지만 저장 직후 merge된 케이스: recentlySaved.items 사용
        const savedISO = recentlySavedFromNav?.date ? outfitAdapter.normalizeISO(recentlySavedFromNav.date) : null;
        if (savedISO && savedISO === selectedISO && Array.isArray(recentlySavedFromNav?.items)) {
            return recentlySavedFromNav!.items;
        }

        return [];
    }, [monthly, selectedISO, recentlySavedFromNav]);

    // calendar cells
    const cells = useMemo(() => buildMonthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

    // nav month
    const goMonth = (delta: number) => {
        const d = new Date(viewYear, viewMonth - 1 + delta, 1);
        const iso = toISO(d);
        setSelectedISO(iso);
        setParams({ date: iso });
    };

    const onPickDay = (iso: string) => {
        if (iso === selectedISO) {
            const fallback = `${viewYear}-${String(viewMonth).padStart(2, "0")}-01`;
            setSelectedISO(fallback);
            setParams({ date: fallback });
            return;
        }
        setSelectedISO(iso);
        setParams({ date: iso });
    };

    // -----------------------------
    // render
    // -----------------------------
    return (
        <div className="max-w-[1280px] mx-auto">
            {showGuide && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(760px,calc(100%-24px))]">
                    <div className="rounded-[18px] border border-slate-100 bg-white shadow-2xl px-4 py-3">
                        <div className="text-sm font-black text-navy-900">사용법</div>
                        <div className="mt-1 text-xs font-bold text-slate-500">
                            1) 날짜 클릭 → 우측 상세 확인 · 2) CHECK 스탬프 = 기록 있음 · 3) 같은 날짜 다시 클릭 → 선택 해제
                        </div>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-12 gap-6 items-start">
                {/* LEFT */}
                <Card className="lg:col-span-8 p-8 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-xs font-black text-slate-300 tracking-widest uppercase">OOTD CALENDAR</div>
                            <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">
                                {viewYear}년 {viewMonth}월
                            </div>
                            <div className="mt-1 text-xs font-bold text-slate-400">기록된 날짜는 스탬프로 표시됩니다.</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="h-10 px-4" onClick={() => goMonth(-1)}>
                                ‹
                            </Button>
                            <Button variant="outline" className="h-10 px-4" onClick={() => goMonth(1)}>
                                ›
                            </Button>
                            <Button variant="outline" className="h-10 px-4" onClick={refresh} isLoading={loading}>
                                <RefreshCw size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* weekday */}
                    <div className="mt-6 grid grid-cols-7 gap-3 px-1">
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((w) => (
                            <div
                                key={w}
                                className={cn(
                                    "text-[11px] font-black tracking-widest text-center",
                                    w === "SUN" ? "text-red-400" : w === "SAT" ? "text-blue-500" : "text-slate-300"
                                )}
                            >
                                {w}
                            </div>
                        ))}
                    </div>

                    {/* grid */}
                    <div className="mt-3 grid grid-cols-7 gap-3">
                        {cells.map((c, idx) => {
                            const iso = toISO(c.date);
                            const inMonth = c.inMonth;

                            const entry = monthlyMap.get(iso);
                            const hasHistory = !!entry;

                            const isSelected = iso === selectedISO;
                            const isToday = iso === todayISO;

                            const dow = c.date.getDay();
                            const numColor =
                                !inMonth
                                    ? "text-slate-200"
                                    : dow === 0
                                        ? "text-red-500"
                                        : dow === 6
                                            ? "text-blue-500"
                                            : "text-navy-900";

                            // 링/배경 규칙
                            const cellBorder = isSelected
                                ? "border-navy-900"
                                : isToday && !hasHistory
                                    ? "border-orange-500"
                                    : "border-slate-100";

                            const cellBg = isToday && hasHistory ? "bg-orange-50/40" : "bg-white";

                            return (
                                <button
                                    key={`${iso}-${idx}`}
                                    onClick={() => onPickDay(iso)}
                                    className={cn(
                                        "relative w-full aspect-square rounded-[16px] border-2 transition-all",
                                        cellBorder,
                                        cellBg,
                                        inMonth ? "opacity-100" : "opacity-45",
                                        "hover:border-orange-200"
                                    )}
                                >
                                    <div className="absolute top-2 left-2">
                                        <span className={cn("text-sm font-black", numColor)}>{c.date.getDate()}</span>
                                    </div>

                                    {hasHistory && (
                                        <div className="absolute top-2 right-2">
                                            <span className="text-sm">{entry?.weatherIcon ?? "🌤️"}</span>
                                        </div>
                                    )}

                                    {hasHistory ? <StampCheck /> : null}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 rounded-[14px] border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                        {err ? <span className="text-red-600">{err}</span> : "기록이 없으면 스탬프가 표시되지 않습니다."}
                    </div>
                </Card>

                {/* RIGHT */}
                <Card className="lg:col-span-4 p-8 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03] lg:sticky lg:top-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs font-black text-slate-300 tracking-widest uppercase">SELECTED DATE</div>
                            <div className="mt-2 text-xl font-black text-navy-900">{selectedISO}</div>
                            {selectedEntry?.title ? (
                                <div className="mt-1 text-xs font-bold text-slate-400 truncate">{selectedEntry.title}</div>
                            ) : null}
                        </div>
                        <Button variant="outline" className="h-10 px-4" onClick={refresh} isLoading={loading}>
                            새로고침
                        </Button>
                    </div>

                    {/* weather */}
                    <div className="mt-6 rounded-[18px] border border-slate-100 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black text-navy-900">날씨</div>
                            <div className="text-lg">{selectedEntry?.weatherIcon ?? "—"}</div>
                        </div>
                        <div className="mt-2 text-sm font-bold text-slate-500">
                            온도: <span className="text-navy-900 font-black">{fmtTemp(selectedEntry?.weatherTemp ?? null)}</span>
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-400">
                            피드백: <span className="text-slate-700 font-black">{selectedEntry?.feedback ?? "-"}</span>
                        </div>
                    </div>

                    {/* outfit list */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black text-navy-900">선택한 옷 조합</div>
                            {selectedEntry ? <Badge variant="orange">기록</Badge> : <Badge variant="slate">없음</Badge>}
                        </div>

                        {!selectedEntry ? (
                            <div className="mt-3 rounded-[18px] border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                이 날짜에는 기록이 없습니다.
                            </div>
                        ) : selectedItems.length === 0 ? (
                            <div className="mt-3 rounded-[18px] border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                기록은 있으나 아이템 데이터가 없습니다.
                            </div>
                        ) : (
                            <div className="mt-3 space-y-3">
                                {selectedItems.map((it) => (
                                    <OutfitRow
                                        key={`${it.clothingId}-${it.sortOrder}`}
                                        item={it}
                                        favorited={favoriteSet.has(it.clothingId)}
                                        scorePercent={scoreMap.get(it.clothingId) ?? null}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CalendarPage;