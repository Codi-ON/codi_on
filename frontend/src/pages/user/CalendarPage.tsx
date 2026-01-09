// src/pages/user/CalendarPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Badge, Button, cn } from "@/app/DesignSystem";
import { RefreshCw } from "lucide-react";

import { outfitRepo } from "@/lib/repo/outfitRepo";
import { outfitAdapter, type HistoryEntryUI } from "@/lib/adapters/outfitAdapter";
import type { MonthlyHistoryDto, TodayOutfitDto, TodayOutfitItemDto } from "@/lib/api/outfitApi";

// -----------------------------
// helpers
// -----------------------------
const GUIDE_TOAST_KEY = "codion.calendar.guideToastShown.v2";

function isoTodayKST(): string {
    // 단순: 브라우저 로컬 기준 (KST 환경이면 OK)
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function parseISO(s: string): Date {
    // YYYY-MM-DD
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function fmtTemp(v: number | null | undefined): string {
    if (typeof v !== "number" || Number.isNaN(v)) return "-";
    return `${v.toFixed(1)}°`;
}

function feedbackEmoji(score?: number | null): string {
    if (score === 1) return "👍";
    if (score === 0) return "😐";
    if (score === -1) return "👎";
    return "⏳";
}

function weatherEmoji(cond?: string | null): string {
    const c = String(cond ?? "").toLowerCase();
    if (c.includes("rain") || c.includes("비")) return "🌧️";
    if (c.includes("snow") || c.includes("눈")) return "❄️";
    if (c.includes("cloud") || c.includes("흐림") || c.includes("구름")) return "☁️";
    if (c.includes("sun") || c.includes("맑")) return "☀️";
    return "🌤️";
}

// 캘린더 매트릭스(6주 고정)
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
    // 뒤쪽 채우기
    while (cells.length < 35) {
        const last = cells[cells.length - 1].date;
        const next = new Date(last);
        next.setDate(last.getDate() + 1);
        cells.push({ date: next, inMonth: false });
    }
    return cells;
}

function toISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// -----------------------------
// UI parts
// -----------------------------
function StampCheck() {
    // “스탬프 1개” (링 하나 + CHECK)
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

            {/* 우측: 하트 + 점수(%) */}
            <div className="flex items-center gap-2 shrink-0">
                <div
                    className={cn(
                        "h-9 px-3 rounded-full border flex items-center gap-2",
                        "border-slate-200 bg-white"
                    )}
                    aria-label="fit-score"
                >
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
const CalendarPage: React.FC = () => {
    const [params, setParams] = useSearchParams();

    const initialDate = params.get("date") ?? isoTodayKST();
    const [selectedISO, setSelectedISO] = useState<string>(initialDate);

    const selectedDateObj = useMemo(() => parseISO(selectedISO), [selectedISO]);
    const viewYear = selectedDateObj.getFullYear();
    const viewMonth = selectedDateObj.getMonth() + 1;

    const todayISO = useMemo(() => isoTodayKST(), []);

    // data
    const [monthly, setMonthly] = useState<MonthlyHistoryDto | null>(null);
    const [today, setToday] = useState<TodayOutfitDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // guide toast
    const [showGuide, setShowGuide] = useState(false);

    // - 실제 redux 구조에 맞게 여기만 연결하면 됨.
    const favoriteSet = useMemo(() => new Set<number>(), []);
    const scoreMap = useMemo(() => new Map<number, number>(), []);

    const refresh = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const [m, t] = await Promise.all([
                outfitRepo.getMonthlyOutfits(viewYear, viewMonth),
                outfitRepo.getTodayOutfit().catch(() => null),
            ]);
            setMonthly(m);
            setToday(t);
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

    // monthly -> map + today merge(오늘만 최신 보정)
    const monthlyMap = useMemo(() => {
        if (!monthly) return new Map<string, HistoryEntryUI>();
        const base = outfitAdapter.monthlyToMap(monthly);
        // today가 같은 월이면 덮어쓰기
        const t = today?.date ? outfitAdapter.normalizeISO(today.date) : null;
        if (t && t.slice(0, 7) === `${viewYear}-${String(viewMonth).padStart(2, "0")}`) {
            return outfitAdapter.mergeRecentlySaved(base, today, null);
        }
        return base;
    }, [monthly, today, viewYear, viewMonth]);

    const selectedEntry = useMemo(() => monthlyMap.get(selectedISO) ?? null, [monthlyMap, selectedISO]);

    // calendar cells
    const cells = useMemo(() => buildMonthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

    // nav
    const goMonth = (delta: number) => {
        const d = new Date(viewYear, viewMonth - 1 + delta, 1);
        const iso = toISO(d);
        setSelectedISO(iso);
        setParams({ date: iso });
    };

    const onPickDay = (iso: string) => {
        // “두 번 클릭 = 선택 해제” (삭제 API 없으니 안전 UX)
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
            {/* guide toast */}
            {showGuide && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(760px,calc(100%-24px))]">
                    <div className="rounded-[18px] border border-slate-100 bg-white shadow-2xl px-4 py-3">
                        <div className="text-sm font-black text-navy-900">사용법</div>
                        <div className="mt-1 text-xs font-bold text-slate-500">
                            1) 날짜 클릭 → 우측에서 상세 확인 · 2) CHECK 스탬프 = 기록 있음 · 3) 같은 날짜 다시 클릭 → 선택 해제
                        </div>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-12 gap-6 items-start">
                {/* LEFT: calendar (더 크게) */}
                <Card className="lg:col-span-8 p-8 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-xs font-black text-slate-300 tracking-widest uppercase">OOTD CALENDAR</div>
                            <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">
                                {viewYear}년 {viewMonth}월
                            </div>
                            <div className="mt-1 text-xs font-bold text-slate-400">
                                기록된 날짜는 스탬프로 표시됩니다.
                            </div>
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

                            // ✅ 링 중복 방지:
                            // - 기록 있으면: 스탬프 1개만
                            // - 오늘 강조: 기록 있는 날엔 배경만 살짝
                            const cellBorder = isSelected
                                ? "border-navy-900"
                                : isToday && !hasHistory
                                    ? "border-orange-500"
                                    : "border-slate-100";

                            const cellBg =
                                isToday && hasHistory ? "bg-orange-50/40" : "bg-white";

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
                                    {/* date number: 좌상단 */}
                                    <div className="absolute top-2 left-2">
                                        <span className={cn("text-sm font-black", numColor)}>{c.date.getDate()}</span>
                                    </div>

                                    {/* weather icon: 우상단 (기록된날만) */}
                                    {hasHistory && (
                                        <div className="absolute top-2 right-2">
                                            <span className="text-sm">{entry?.weatherIcon ?? "🌤️"}</span>
                                        </div>
                                    )}

                                    {/* stamp: 기록 있는 날만 */}
                                    {hasHistory ? <StampCheck /> : null}
                                </button>
                            );
                        })}
                    </div>

                    {/* footer */}
                    <div className="mt-6 rounded-[14px] border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                        {err ? <span className="text-red-600">{err}</span> : "기록이 없으면 스탬프가 표시되지 않습니다."}
                    </div>
                </Card>

                {/* RIGHT: detail */}
                <Card className="lg:col-span-4 p-8 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03] lg:sticky lg:top-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs font-black text-slate-300 tracking-widest uppercase">SELECTED DATE</div>
                            <div className="mt-2 text-xl font-black text-navy-900">{selectedISO}</div>
                        </div>
                        <Button variant="outline" className="h-10 px-4" onClick={refresh} isLoading={loading}>
                            새로고침
                        </Button>
                    </div>

                    {/* weather on top (요구 반영) */}
                    <div className="mt-6 rounded-[18px] border border-slate-100 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black text-navy-900">날씨</div>
                            <div className="text-lg">{selectedEntry?.weatherIcon ?? "—"}</div>
                        </div>
                        <div className="mt-2 text-sm font-bold text-slate-500">
                            온도: <span className="text-navy-900 font-black">{fmtTemp(selectedEntry?.weatherTemp ?? null)}</span>
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-400">
                            컨디션: <span className="text-slate-600 font-black">{selectedEntry ? (selectedEntry.weatherIcon ? "" : "") : "-"}</span>
                            <span className="ml-1 text-slate-600 font-black">
                {selectedEntry ? (selectedEntry.weatherIcon ? "" : "") : ""}
              </span>
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-400">
                            피드백: <span className="text-base">{feedbackEmoji((selectedEntry as any)?.feedbackScore ?? null)}</span>
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
                        ) : (
                            <div className="mt-3 space-y-3">
                                {(monthly?.days ?? [])
                                    .find((d) => outfitAdapter.normalizeISO(d.date) === selectedISO)
                                    ?.items?.map((it) => (
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

                    {/*/!* note *!/*/}
                    {/*<div className="mt-6 text-[11px] font-bold text-slate-400 leading-relaxed">*/}
                    {/*    삭제 동작은 현재 API가 없으면 동기화되지 않습니다. (삭제 엔드포인트 붙이면 “두 번 클릭 삭제”로 변경 권장)*/}
                    {/*</div>*/}
                </Card>
            </div>
        </div>
    );
};

export default CalendarPage;