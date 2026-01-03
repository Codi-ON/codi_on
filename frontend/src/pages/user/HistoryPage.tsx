import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Card, Button, Badge, cn } from "@/app/DesignSystem";
import { Calendar as CalendarIcon, List, ArrowRight, Thermometer, Cloud, Sparkles, Shirt } from "lucide-react";

import { outfitApi } from "@/lib/api/outfitApi";
import { outfitAdapter, type HistoryEntryUI } from "@/lib/adapters/outfitAdapter";

// ✅ redux
import { useAppDispatch, useAppSelector } from "@/state/hooks/hooks";
import {
    selectLastSavedTodayOutfit,
    selectSelectedOutfitSnapshot,
    clearLastSaved,
} from "@/state/outfitReco/outfitRecoSlice";

function formatKoreanDate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso || "-";
    return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

function isValidISODate(s?: string | null) {
    return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toISO(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function addMonths(d: Date, months: number) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + months);
    return x;
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

type RangeKey = "LAST_7" | "THIS_MONTH" | "LAST_3_MONTHS" | "LAST_12_MONTHS";
function rangeLabel(range: RangeKey) {
    switch (range) {
        case "LAST_7":
            return "최근 7일";
        case "THIS_MONTH":
            return "이번 달";
        case "LAST_3_MONTHS":
            return "최근 3개월";
        case "LAST_12_MONTHS":
        default:
            return "최근 12개월";
    }
}

type YearKey = "THIS_YEAR" | "LAST_YEAR" | "ALL";
function yearLabel(y: YearKey) {
    switch (y) {
        case "THIS_YEAR":
            return "올해";
        case "LAST_YEAR":
            return "작년";
        case "ALL":
        default:
            return "전체";
    }
}

type SeasonKey = "ALL" | "SPRING" | "SUMMER" | "FALL" | "WINTER";
function seasonLabel(s: SeasonKey) {
    switch (s) {
        case "SPRING":
            return "봄";
        case "SUMMER":
            return "여름";
        case "FALL":
            return "가을";
        case "WINTER":
            return "겨울";
        case "ALL":
        default:
            return "전체";
    }
}

function seasonMonths(season: SeasonKey): number[] {
    // month: 1~12
    switch (season) {
        case "SPRING":
            return [3, 4, 5];
        case "SUMMER":
            return [6, 7, 8];
        case "FALL":
            return [9, 10, 11];
        case "WINTER":
            // “해당 연도 내” 겨울로 단순화: 12,1,2
            return [12, 1, 2];
        default:
            return [];
    }
}

type MonthPair = { year: number; month: number }; // month 1~12

function buildMonthsByRange(range: RangeKey): MonthPair[] {
    const now = new Date();
    const thisYM: MonthPair = { year: now.getFullYear(), month: now.getMonth() + 1 };

    // LAST_7은 월 경계 넘어갈 수 있으니 2개월만 확보
    if (range === "LAST_7") {
        const prev = addMonths(now, -1);
        return [
            thisYM,
            { year: prev.getFullYear(), month: prev.getMonth() + 1 },
        ];
    }

    if (range === "THIS_MONTH") return [thisYM];

    if (range === "LAST_3_MONTHS") {
        const m1 = addMonths(now, -1);
        const m2 = addMonths(now, -2);
        return [
            thisYM,
            { year: m1.getFullYear(), month: m1.getMonth() + 1 },
            { year: m2.getFullYear(), month: m2.getMonth() + 1 },
        ];
    }

    // LAST_12_MONTHS
    const pairs: MonthPair[] = [];
    for (let i = 0; i < 12; i++) {
        const d = addMonths(now, -i);
        pairs.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return pairs;
}

function buildMonthsByYearSeason(yearKey: YearKey, seasonKey: SeasonKey): MonthPair[] {
    const now = new Date();
    const targetYears =
        yearKey === "ALL"
            ? [now.getFullYear(), now.getFullYear() - 1] // ✅ 전체는 2년만 (필요하면 늘려)
            : [yearKey === "THIS_YEAR" ? now.getFullYear() : now.getFullYear() - 1];

    if (seasonKey === "ALL") {
        // 연도만 선택 -> 그 연도 12개월
        const out: MonthPair[] = [];
        for (const y of targetYears) {
            for (let m = 1; m <= 12; m++) out.push({ year: y, month: m });
        }
        return out;
    }

    const months = seasonMonths(seasonKey);
    const out: MonthPair[] = [];
    for (const y of targetYears) {
        for (const m of months) out.push({ year: y, month: m });
    }
    return out;
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isList = pathname.startsWith("/history");

    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get("date");
    const highlightFromQuery = isValidISODate(dateParam) ? String(dateParam) : null;

    const dispatch = useAppDispatch();
    const lastSavedTodayOutfit = useAppSelector(selectLastSavedTodayOutfit);
    const selectedOutfitSnapshot = useAppSelector(selectSelectedOutfitSnapshot);

    // ✅ highlight 우선순위: query > lastSaved > 없음
    const highlightISO = useMemo(() => {
        if (highlightFromQuery) return highlightFromQuery;
        const d = lastSavedTodayOutfit?.date;
        return isValidISODate(d) ? String(d) : null;
    }, [highlightFromQuery, lastSavedTodayOutfit?.date]);

    // ✅ 기본 필터: “히스토리”는 넓게 보는게 맞아서 3개월 권장
    const [range, setRange] = useState<RangeKey>("LAST_3_MONTHS");
    const [yearFilter, setYearFilter] = useState<YearKey>("THIS_YEAR");
    const [seasonFilter, setSeasonFilter] = useState<SeasonKey>("ALL");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 최종 entries
    const [entries, setEntries] = useState<HistoryEntryUI[]>([]);

    // ✅ “저장 직후 한번 보여주고 끝” 처리용
    const mergedOnceRef = useRef(false);

    // ✅ 히스토리 로드: (1) 월별 API 합치기 → (2) lastSaved merge → (3) range 필터/정렬 → (4) highlight pin
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const monthsToLoad =
                    seasonFilter !== "ALL" || yearFilter !== "THIS_YEAR"
                        ? buildMonthsByYearSeason(yearFilter, seasonFilter)
                        : buildMonthsByRange(range);

                const monthlyList = await Promise.all(
                    monthsToLoad.map((p) => outfitApi.getMonthly(p.year, p.month))
                );

                // 1) 월별 map 합치기
                const baseMap = new Map<string, HistoryEntryUI>();
                for (const m of monthlyList) {
                    const mp = outfitAdapter.monthlyToMap(m as any);
                    for (const [k, v] of mp.entries()) baseMap.set(k, v);
                }

                // 2) 저장 직후(lastSaved) + 선택 스냅샷 merge
                // selectedOutfitSnapshot은 타입이 달라도 name/imageUrl/clothingId만 있으면 title 생성 가능
                const mergedMap = outfitAdapter.mergeRecentlySaved(
                    baseMap,
                    lastSavedTodayOutfit ?? null,
                    (selectedOutfitSnapshot as any) ?? null
                );

                // 3) map -> list
                const all = Array.from(mergedMap.values()).filter((e) => isValidISODate(e.dateISO));

                // 4) range 필터 (range가 적용되는 경우만)
                const now = new Date();
                let minISO = "0000-01-01";
                if (seasonFilter === "ALL" && yearFilter === "THIS_YEAR") {
                    if (range === "LAST_7") minISO = toISO(addDays(now, -6));
                    else if (range === "THIS_MONTH") minISO = toISO(startOfMonth(now));
                    else if (range === "LAST_3_MONTHS") minISO = toISO(startOfMonth(addMonths(now, -2)));
                    else minISO = toISO(startOfMonth(addMonths(now, -11)));
                }

                const ranged = all.filter((e) => e.dateISO >= minISO);

                // 5) 정렬: 기본 최신순
                ranged.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

                // 6) highlight 우선 pin
                const pinned = highlightISO ? ranged.find((e) => e.dateISO === highlightISO) : null;
                const rest = highlightISO ? ranged.filter((e) => e.dateISO !== highlightISO) : ranged;

                const finalList = pinned ? [pinned, ...rest] : rest;

                if (mounted) setEntries(finalList);

                // ✅ 저장 직후 UX: 히스토리에서도 한번 보여주고 clear 할지 여부
                // - query date로 들어온 경우(저장 후 이동)만 clear 하는게 안전
                if (
                    !mergedOnceRef.current &&
                    lastSavedTodayOutfit?.date &&
                    highlightFromQuery &&
                    highlightFromQuery === lastSavedTodayOutfit.date
                ) {
                    mergedOnceRef.current = true;
                    dispatch(clearLastSaved());
                }
            } catch (e: any) {
                if (mounted) setError(e?.message ?? "히스토리를 불러오지 못했습니다.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [
        range,
        yearFilter,
        seasonFilter,
        highlightISO,
        highlightFromQuery,
        lastSavedTodayOutfit,
        selectedOutfitSnapshot,
        dispatch,
    ]);

    // ✅ 요약
    const summary = useMemo(() => {
        const count = entries.length;
        const temps = entries.map((e) => e.weatherTemp).filter((n) => Number.isFinite(n)) as number[];
        const avgTemp = temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : 0;
        return { count, avgTemp };
    }, [entries]);

    // ✅ 우측: 최근 선택 아이템
    const recentItemThumbs = useMemo(() => {
        const urls = entries.flatMap((e) => e.images ?? []);
        const uniq = Array.from(new Set(urls));
        return uniq.slice(0, 8);
    }, [entries]);

    const recentLogs = useMemo(() => entries.slice(0, 5), [entries]);

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">스타일 히스토리</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        highlight(날짜 지정) 우선 노출, 없으면 최신순으로 정리됩니다.
                    </p>
                </div>

                {/* Toggle */}
                <div className="self-start lg:self-auto">
                    <div className="bg-white p-1 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => navigate(`/calendar${highlightISO ? `?date=${highlightISO}` : ""}`)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                                !isList ? "bg-[#0F172A] text-white shadow-lg shadow-navy-900/20" : "text-slate-400 hover:bg-slate-50"
                            )}
                        >
                            <CalendarIcon size={16} /> 캘린더
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/history")}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                                isList ? "bg-[#0F172A] text-white shadow-lg shadow-navy-900/20" : "text-slate-400 hover:bg-slate-50"
                            )}
                        >
                            <List size={16} /> 리스트
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-5">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-black text-slate-600 mr-2">빠른 범위</div>
                        {(["LAST_7", "THIS_MONTH", "LAST_3_MONTHS", "LAST_12_MONTHS"] as RangeKey[]).map((k) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => {
                                    setSeasonFilter("ALL");
                                    setYearFilter("THIS_YEAR");
                                    setRange(k);
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-2xl text-xs font-black border transition",
                                    range === k && seasonFilter === "ALL" && yearFilter === "THIS_YEAR"
                                        ? "bg-[#0F172A] text-white border-[#0F172A]"
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {rangeLabel(k)}
                            </button>
                        ))}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/calendar${highlightISO ? `?date=${highlightISO}` : ""}`)}
                        >
                            캘린더로 찾기
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-black text-slate-600 mr-2">연도</div>
                        {(["THIS_YEAR", "LAST_YEAR", "ALL"] as YearKey[]).map((y) => (
                            <button
                                key={y}
                                type="button"
                                onClick={() => setYearFilter(y)}
                                className={cn(
                                    "px-4 py-2 rounded-2xl text-xs font-black border transition",
                                    yearFilter === y ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {yearLabel(y)}
                            </button>
                        ))}

                        <div className="text-sm font-black text-slate-600 ml-4 mr-2">계절</div>
                        {(["ALL", "SPRING", "SUMMER", "FALL", "WINTER"] as SeasonKey[]).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSeasonFilter(s)}
                                className={cn(
                                    "px-4 py-2 rounded-2xl text-xs font-black border transition",
                                    seasonFilter === s ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {seasonLabel(s)}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                </div>
            )}

            {/* Main layout */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
                {/* LEFT */}
                <div className="space-y-4">
                    {/* Summary */}
                    <Card className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-500">
                                    {seasonFilter !== "ALL" || yearFilter !== "THIS_YEAR"
                                        ? `${yearLabel(yearFilter)} · ${seasonLabel(seasonFilter)}`
                                        : rangeLabel(range)}{" "}
                                    요약
                                </div>
                                <div className="text-lg font-black text-[#0F172A]">
                                    {loading ? "불러오는 중..." : `검색 결과 ${summary.count}건`}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <div className="text-[11px] font-bold text-slate-500">평균기온</div>
                                    <div className="text-xl font-black text-[#0F172A]">{summary.avgTemp}°</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <div className="text-[11px] font-bold text-slate-500">기록</div>
                                    <div className="text-xl font-black text-[#0F172A]">{summary.count}</div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Row List */}
                    <Card className="overflow-hidden">
                        <div className="grid grid-cols-[140px_1fr_160px] gap-0 border-b border-slate-100 px-5 py-3 text-[11px] font-black text-slate-400 tracking-widest">
                            <div>DATE</div>
                            <div>OUTFIT</div>
                            <div className="text-right">ACTION</div>
                        </div>

                        {!loading && entries.length === 0 ? (
                            <div className="p-8 text-sm text-slate-500">
                                해당 조건에 기록이 없습니다. 필터를 완화하거나, 추천을 생성해 기록을 쌓으세요.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {entries.map((entry) => {
                                    const isHighlight = highlightISO && entry.dateISO === highlightISO;

                                    return (
                                        <div
                                            key={entry.id}
                                            className={cn("px-5 py-4 transition-colors", isHighlight ? "bg-orange-50" : "hover:bg-slate-50")}
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_160px] items-center gap-4">
                                                {/* date */}
                                                <div className="text-sm font-black text-slate-600">{formatKoreanDate(entry.dateISO)}</div>

                                                {/* outfit info */}
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {entry.images.length > 0 ? (
                                                            entry.images.slice(0, 3).map((src, i) => (
                                                                <div
                                                                    key={src + i}
                                                                    className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                                                                >
                                                                    <img src={src} className="w-full h-full object-cover" alt="ootd" />
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="w-[124px] h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                                                                <Shirt size={16} />
                                                                이미지 없음
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="text-base font-black text-[#0F172A] truncate">{entry.title}</div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1">
                              <span className="inline-flex items-center gap-1">
                                <Cloud size={14} /> {entry.weatherIcon}
                              </span>
                                                            <span className="inline-flex items-center gap-1">
                                <Thermometer size={14} /> {entry.weatherTemp == null ? "-" : `${entry.weatherTemp}°C`}
                              </span>

                                                            {/* ✅ 추천 피드백(좋/괜/별) 표시 */}
                                                            {entry.feedback ? (
                                                                <Badge variant="orange">{entry.feedback}</Badge>
                                                            ) : (
                                                                <Badge variant="outline">피드백 없음</Badge>
                                                            )}

                                                            {isHighlight ? (
                                                                <span className="inline-flex items-center gap-1">
                                  <Sparkles size={14} /> highlight
                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* action */}
                                                <div className="flex md:justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => navigate(`/calendar?date=${entry.dateISO}`)}>
                                                        캘린더
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            // 상세 라우트가 없으면 캘린더 드로어로 통일
                                                            navigate(`/calendar?date=${entry.dateISO}`);
                                                        }}
                                                    >
                                                        상세 <ArrowRight size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>

                {/* RIGHT */}
                <aside className="xl:sticky xl:top-6 h-fit space-y-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black text-slate-500">최근 선택한 아이템</div>
                            <button
                                type="button"
                                onClick={() => navigate("/closet")}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                옷장 보기
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {recentItemThumbs.length > 0 ? (
                                recentItemThumbs.map((src, i) => (
                                    <button
                                        key={src + i}
                                        type="button"
                                        onClick={() => navigate("/closet")}
                                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-sm transition"
                                        title="최근 선택 아이템"
                                    >
                                        <img src={src} className="w-full h-full object-cover" alt="recent item" />
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                                    아직 선택한 아이템 이미지가 없어요
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <div className="text-sm font-black text-slate-500">최근 기록</div>
                            <div className="mt-3 space-y-2">
                                {recentLogs.length > 0 ? (
                                    recentLogs.map((e) => (
                                        <button
                                            key={e.id}
                                            type="button"
                                            onClick={() => navigate(`/calendar?date=${e.dateISO}`)}
                                            className={cn(
                                                "w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-3",
                                                "hover:bg-slate-50 transition flex items-center justify-between gap-3"
                                            )}
                                        >
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-bold text-slate-500">{formatKoreanDate(e.dateISO)}</div>
                                                <div className="text-sm font-black text-[#0F172A] truncate">{e.title}</div>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <div className="text-lg">{e.weatherIcon}</div>
                                                <div className="text-[11px] font-black text-slate-500">{e.weatherTemp ?? "-"}°C</div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-400">
                                        최근 기록이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm font-black text-slate-500">빠른 작업</div>
                        <div className="mt-4 flex flex-col gap-2">
                            <Button size="sm" onClick={() => navigate("/recommendation")}>
                                오늘 스타일 추천 받기
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => navigate("/calendar")}>
                                OOTD 캘린더 보기
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => navigate("/closet")}>
                                옷장 관리
                            </Button>
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
}