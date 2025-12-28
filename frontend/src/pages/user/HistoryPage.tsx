import React, {useMemo, useState} from "react";
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import {Card, Button, Badge, cn} from "@/app/DesignSystem";
import {
    Calendar as CalendarIcon,
    List,
    ArrowRight,
    Thermometer,
    Cloud,
    Sparkles,
    Shirt,
    History as HistoryIcon,
} from "lucide-react";
import {MOCK_HISTORY} from "@/shared/ui/mock";

type HistoryEntryUI = {
    id: string;
    dateISO: string; // YYYY-MM-DD
    title: string;
    weatherTemp: number;
    weatherIcon: React.ReactNode;
    images: string[];
};

function weatherIconFromCondition(cond?: string) {
    const c = (cond ?? "").toLowerCase();
    if (c.includes("rain") || c.includes("비")) return "🌧️";
    if (c.includes("snow") || c.includes("눈")) return "❄️";
    if (c.includes("cloud") || c.includes("흐림") || c.includes("구름")) return "☁️";
    if (c.includes("sun") || c.includes("맑")) return "☀️";
    return "🌤️";
}

function formatKoreanDate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso || "-";
    return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

function toISO(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + months);
    return x;
}

function isValidISODate(s?: string | null) {
    return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toHistoryEntryUI(raw: any, idx: number): HistoryEntryUI {
    const id = String(raw?.id ?? raw?.historyId ?? `h-${idx}`);

    const dateISO = String(
        raw?.date ?? raw?.weatherDate ?? raw?.createdAt ?? "2025-12-28"
    ).slice(0, 10);

    const title = String(
        raw?.styleName ?? raw?.style ?? raw?.title ?? raw?.note ?? "기록된 코디"
    );

    const weatherTemp = Number(
        raw?.weatherTemp ?? raw?.weather?.temp ?? raw?.weather?.temperature ?? 0
    );

    const weatherIcon =
        raw?.weatherIcon ??
        weatherIconFromCondition(raw?.weather?.condition ?? raw?.weather?.description);

    const imagesFromRaw =
        Array.isArray(raw?.images)
            ? raw.images
            : Array.isArray(raw?.items)
                ? raw.items.map((it: any) => it?.imageUrl).filter(Boolean)
                : Array.isArray(raw?.outfit)
                    ? raw.outfit.map((it: any) => it?.imageUrl).filter(Boolean)
                    : [];

    const images = imagesFromRaw.filter(Boolean).slice(0, 3);

    return {id, dateISO, title, weatherTemp, weatherIcon, images};
}

type RangeKey = "LAST_7" | "THIS_MONTH" | "LAST_3_MONTHS" | "ALL";

function rangeLabel(range: RangeKey) {
    switch (range) {
        case "LAST_7":
            return "최근 7일";
        case "THIS_MONTH":
            return "이번 달";
        case "LAST_3_MONTHS":
            return "최근 3개월";
        case "ALL":
        default:
            return "전체";
    }
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const {pathname} = useLocation();
    const isList = pathname.startsWith("/history");

    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get("date");
    const highlightISO = isValidISODate(dateParam) ? String(dateParam) : null;

    // ✅ 기본은 사용자가 클릭하기 좋은 범위
    const [range, setRange] = useState<RangeKey>("THIS_MONTH");

    const allEntries = useMemo(() => {
        const arr = Array.isArray(MOCK_HISTORY) ? MOCK_HISTORY : [];
        return arr.map(toHistoryEntryUI).sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
    }, []);

    const filtered = useMemo(() => {
        const now = new Date();
        let minISO = "0000-01-01";

        if (range === "LAST_7") {
            minISO = toISO(addDays(now, -6)); // 오늘 포함 7일
        } else if (range === "THIS_MONTH") {
            minISO = toISO(startOfMonth(now));
        } else if (range === "LAST_3_MONTHS") {
            minISO = toISO(startOfMonth(addMonths(now, -2))); // 이번달 포함 3개월
        } else {
            minISO = "0000-01-01";
        }

        return allEntries.filter((e) => e.dateISO >= minISO);
    }, [allEntries, range]);

    const summary = useMemo(() => {
        const count = filtered.length;
        const temps = filtered.map((e) => e.weatherTemp).filter((n) => Number.isFinite(n));
        const avgTemp = temps.length
            ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
            : 0;
        return {count, avgTemp};
    }, [filtered]);

    // ✅ 우측: 최근 선택 아이템 (이미지 URL flatten)
    const recentItemThumbs = useMemo(() => {
        const urls = allEntries.flatMap((e) => e.images ?? []);
        const uniq = Array.from(new Set(urls));
        return uniq.slice(0, 8);
    }, [allEntries]);

    // ✅ 우측: 최근 기록
    const recentLogs = useMemo(() => allEntries.slice(0, 5), [allEntries]);

    // ✅ 우측: 작년 같은 날(타임머신) — 메인에서 빼고 사이드로
    const baseISO = useMemo(() => {
        if (isValidISODate(dateParam)) return String(dateParam);
        return toISO(new Date());
    }, [dateParam]);

    const lastYearSameDay = useMemo(() => {
        const [y, m, d] = baseISO.split("-").map(Number);
        const last = new Date(y - 1, m - 1, d);
        const key = toISO(last);
        return allEntries.find((e) => e.dateISO === key) ?? null;
    }, [allEntries, baseISO]);

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">스타일 히스토리</h1>

                    </div>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        날짜 탐색은 캘린더가 메인이라, 히스토리는 “범위 클릭”으로 빠르게 찾습니다.
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
                                !isList
                                    ? "bg-[#0F172A] text-white shadow-lg shadow-navy-900/20"
                                    : "text-slate-400 hover:bg-slate-50"
                            )}
                            aria-pressed={!isList}
                        >
                            <CalendarIcon size={16}/> 캘린더
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/history")}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                                isList
                                    ? "bg-[#0F172A] text-white shadow-lg shadow-navy-900/20"
                                    : "text-slate-400 hover:bg-slate-50"
                            )}
                            aria-pressed={isList}
                        >
                            <List size={16}/> 리스트
                        </button>
                    </div>
                </div>
            </div>

            {/* ✅ Click Filters (검색 입력 제거) */}
            <Card className="p-5">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                    <div>
                        <div className="text-sm font-black text-slate-600">빠른 필터</div>
                        <div className="text-xs font-bold text-slate-400 mt-1">
                            날짜로 찾고 싶으면 캘린더에서 선택 후 다시 돌아오면 됩니다.
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        {(["LAST_7", "THIS_MONTH", "LAST_3_MONTHS", "ALL"] as RangeKey[]).map((k) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setRange(k)}
                                className={cn(
                                    "px-4 py-2 rounded-2xl text-xs font-black border transition",
                                    range === k
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
                </div>
            </Card>

            {/* Main layout */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
                {/* LEFT */}
                <div className="space-y-4">
                    {/* Summary */}
                    <Card className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-500">{rangeLabel(range)} 요약</div>
                                <div className="text-lg font-black text-[#0F172A]">검색 결과 {summary.count}건</div>
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
                        <div
                            className="grid grid-cols-[140px_1fr_160px] gap-0 border-b border-slate-100 px-5 py-3 text-[11px] font-black text-slate-400 tracking-widest">
                            <div>DATE</div>
                            <div>OUTFIT</div>
                            <div className="text-right">ACTION</div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="p-8 text-sm text-slate-500">
                                해당 기간에 기록이 없습니다. 필터를 “전체”로 바꾸거나, 추천을 생성해 기록을 쌓으세요.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filtered.map((entry) => {
                                    const isHighlight = highlightISO && entry.dateISO === highlightISO;
                                    return (
                                        <div
                                            key={entry.id}
                                            className={cn(
                                                "px-5 py-4 transition-colors",
                                                isHighlight ? "bg-orange-50" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div
                                                className="grid grid-cols-1 md:grid-cols-[140px_1fr_160px] items-center gap-4">
                                                {/* date */}
                                                <div
                                                    className="text-sm font-black text-slate-600">{formatKoreanDate(entry.dateISO)}</div>

                                                {/* outfit info */}
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {entry.images.length > 0 ? (
                                                            entry.images.slice(0, 3).map((src, i) => (
                                                                <div
                                                                    key={src + i}
                                                                    className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                                                                >
                                                                    <img src={src}
                                                                         className="w-full h-full object-cover"
                                                                         alt="ootd"/>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div
                                                                className="w-[124px] h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                                                                <Shirt size={16}/>
                                                                이미지 없음
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div
                                                            className="text-base font-black text-[#0F172A] truncate">{entry.title}</div>
                                                        <div
                                                            className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1">
                              <span className="inline-flex items-center gap-1">
                                <Cloud size={14}/> {entry.weatherIcon}
                              </span>
                                                            <span className="inline-flex items-center gap-1">
                                <Thermometer size={14}/> {entry.weatherTemp}°C
                              </span>
                                                            <span className="inline-flex items-center gap-1">
                                <Sparkles size={14}/> 저장됨
                              </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* action */}
                                                <div className="flex md:justify-end gap-2">
                                                    <Button size="sm" variant="outline"
                                                            onClick={() => navigate(`/calendar?date=${entry.dateISO}`)}>
                                                        캘린더
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            // TODO: 상세 라우트 생기면 연결
                                                            // navigate(`/history/${entry.id}`)
                                                        }}
                                                    >
                                                        상세 <ArrowRight size={16}/>
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
                    {/* ✅ 최근 선택 아이템 + 최근 기록 */}
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
                                        <img src={src} className="w-full h-full object-cover" alt="recent item"/>
                                    </button>
                                ))
                            ) : (
                                <div
                                    className="col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
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
                                                <div
                                                    className="text-[11px] font-bold text-slate-500">{formatKoreanDate(e.dateISO)}</div>
                                                <div
                                                    className="text-sm font-black text-[#0F172A] truncate">{e.title}</div>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <div className="text-lg">{e.weatherIcon}</div>
                                                <div
                                                    className="text-[11px] font-black text-slate-500">{e.weatherTemp}°C
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-400">
                                        최근 기록이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* ✅ 타임머신(작년 같은 날) -> 빠른 작업 영역으로 이동 */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black text-slate-500 flex items-center gap-2">
                                <HistoryIcon size={16}/>
                                작년 같은 날
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate(`/calendar?date=${baseISO}`)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                기준일 보기
                            </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                            {lastYearSameDay ? (
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-bold text-slate-500">
                                            {formatKoreanDate(lastYearSameDay.dateISO)}
                                        </div>
                                        <div
                                            className="text-base font-black text-[#0F172A] truncate">{lastYearSameDay.title}</div>
                                        <div className="text-xs font-bold text-slate-500 mt-1">
                                            날씨 {lastYearSameDay.weatherTemp}°C
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline"
                                            onClick={() => navigate(`/calendar?date=${lastYearSameDay.dateISO}`)}>
                                        보기
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-black text-[#0F172A]">기록이 없습니다.</div>
                                        <div className="text-xs font-bold text-slate-500 mt-1">
                                            기록을 쌓으면 작년 오늘을 바로 비교할 수 있어요.
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => navigate("/recommendation")}>
                                        추천 받기
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* ✅ 빠른 작업 */}
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