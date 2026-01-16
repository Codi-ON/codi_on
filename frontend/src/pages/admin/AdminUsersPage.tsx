// src/pages/admin/AdminDashboardPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from "recharts";

import { Card, Button, cn } from "@/app/DesignSystem";
import { adminDashboardApi } from "@/lib/api/adminDashboardApi";
import type { AdminDashboardOverviewDto } from "@/shared/domain/adminDashboard";

const COLORS = {
    navy: "#0F1E3D",
    orange: "#F17A2A",
    gray2: "#E2E8F0",
};

const TOPN_DEFAULT = 10;

/**
 * ✅ "200 OK + 전부 0"이면 화면이 서비스 없어보임 → 데모로 채울지 여부
 * - 운영: false 권장(0이면 0이 맞음)
 * - 포폴/시연: true 권장(화면이 살아있어 보임)
 */
const USE_DEMO_WHEN_EMPTY = true;

type Preset = "7d" | "14d" | "30d" | "90d" | "thisMonth" | "lastMonth" | "custom";

type DailySessionRow = {
    date: string; // YYYY-MM-DD
    sessionEventCount: number;
    uniqueUserCount: number;
    errorEventCount: number;
    errorRate?: number; // optional (백이 안줄 수 있음)
};

type DailyClickRow = {
    date: string; // YYYY-MM-DD
    clickCount: number;
};

type TopClickedItemRow = {
    itemId: number | string;
    name?: string;
    clickCount: number;
};

function toISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// TZ 안전 파싱: "YYYY-MM-DD" → local date
function parseISODate(s?: string | null) {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const d = new Date(y, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}
function clampPct(x: number) {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(100, x));
}

function num(v: any) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function buildPresetRange(p: Preset): { from: Date; to: Date } {
    const today = new Date();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (p === "thisMonth") return { from: startOfMonth(to), to };
    if (p === "lastMonth") {
        const last = new Date(to.getFullYear(), to.getMonth() - 1, 1);
        return { from: startOfMonth(last), to: endOfMonth(last) };
    }

    const days = p === "7d" ? 6 : p === "14d" ? 13 : p === "30d" ? 29 : p === "90d" ? 89 : 6;
    return { from: addDays(to, -days), to };
}

function fillDailySeries<T extends { date: string }>(from: Date, to: Date, rows: T[], makeRow: (iso: string) => T): T[] {
    const map = new Map<string, T>();
    rows.forEach((r) => map.set(r.date, r));
    const out: T[] = [];
    for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
        const iso = toISODate(d);
        out.push(map.get(iso) ?? makeRow(iso));
    }
    return out;
}

/**
 * ✅ 성공(200) 응답이어도 "전부 0"이면 의미없는 데이터로 판단
 */
function hasMeaningfulData(dto: AdminDashboardOverviewDto | null) {
    if (!dto) return false;
    const metrics: any = dto.metrics;
    const s: any = metrics?.summary;
    if (!s) return false;

    const summaryNonZero =
        num(s.totalSessions) > 0 ||
        num(s.totalSessionEvents) > 0 ||
        num(s.uniqueUsers) > 0 ||
        num(s.totalRecoEvents) > 0 ||
        num(s.totalClicks) > 0 ||
        num(s.errorEvents) > 0 ||
        num(s.startedSessions) > 0 ||
        num(s.endedSessions) > 0 ||
        num(s.recoEmpty) > 0 ||
        num(s.recoGenerated) > 0 ||
        num(s.funnel?.checklistSubmitted) > 0 ||
        num(s.funnel?.recoShown) > 0 ||
        num(s.funnel?.itemSelected) > 0;

    const dailyNonZero = (metrics?.dailySessions ?? []).some((r: any) => {
        return num(r.sessionEventCount) > 0 || num(r.uniqueUserCount) > 0 || num(r.errorEventCount) > 0;
    });

    const clickNonZero = (metrics?.dailyClicks ?? []).some((r: any) => num(r.clickCount) > 0);
    const topNonZero = (metrics?.topClickedItems ?? []).some((r: any) => num(r.clickCount) > 0);

    const d1NonZero =
        num(metrics?.d1RetentionSummary?.eligibleUsers) > 0 ||
        num(metrics?.d1RetentionSummary?.retainedUsers) > 0 ||
        (metrics?.d1RetentionTrend ?? []).some((r: any) => num(r.baseUsers) > 0);

    return summaryNonZero || dailyNonZero || clickNonZero || topNonZero || d1NonZero;
}

/**
 * ✅ 시연용 더미 데이터(도넛/차트/Top 클릭/리텐션까지 채움)
 */
function makeDemo(from: Date, to: Date, topN: number): AdminDashboardOverviewDto {
    const days: DailySessionRow[] = [];
    const clicks: DailyClickRow[] = [];
    let totalEvents = 0;
    let totalSessions = 0;
    let errorEvents = 0;

    const totalDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));

    for (let i = 0, d = new Date(from); d <= to; d = addDays(d, 1), i++) {
        const base = 80 + (i % 7) * 12;
        const spike = i === totalDays - 2 ? 420 : 0;
        const sessionEventCount = base + spike;
        const uniqueUserCount = 3 + (i % 3);
        const err = Math.max(0, Math.round(sessionEventCount * (0.03 + (i % 5) * 0.004)));

        totalEvents += sessionEventCount;
        totalSessions += Math.round(sessionEventCount * 0.55);
        errorEvents += err;

        days.push({
            date: toISODate(d),
            sessionEventCount,
            uniqueUserCount,
            errorEventCount: err,
            errorRate: clampPct((err / Math.max(1, sessionEventCount)) * 100),
        });

        if (i % 3 === 0) clicks.push({ date: toISODate(d), clickCount: 1 + (i % 2) });
    }

    const checklistSubmitted = 120;
    const recoShown = 80;
    const itemSelected = 44;

    const startedSessions = Math.max(1, Math.round(totalSessions));
    const endedSessions = Math.max(1, Math.round(startedSessions * 0.62));

    const demo: any = {
        meta: {
            from: toISODate(from),
            to: toISODate(to),
            generatedAt: new Date().toISOString(),
            topN,
        },
        metrics: {
            summary: {
                totalSessionEvents: totalEvents,
                totalSessions,
                uniqueUsers: 6,
                avgSessionsPerUser: Math.round(totalSessions / 6),

                totalClicks: clicks.reduce((a, c) => a + c.clickCount, 0),
                totalRecoEvents: 240,
                errorEvents,

                startedSessions,
                endedSessions,
                sessionEndRate: clampPct((endedSessions / Math.max(1, startedSessions)) * 100),

                recoEmpty: 18,
                recoGenerated: 222,
                recoEmptyRate: clampPct((18 / 240) * 100),

                returningRate: 71.4,

                funnel: {
                    checklistSubmitted,
                    recoShown,
                    itemSelected,
                    checklistToShownRate: clampPct((recoShown / Math.max(1, checklistSubmitted)) * 100),
                    shownToSelectRate: clampPct((itemSelected / Math.max(1, recoShown)) * 100),
                },
            },
            dailySessions: days,
            dailyClicks: clicks,
            topClickedItems: Array.from({ length: Math.min(topN, 20) }).map((_, idx) => ({
                itemId: idx + 1,
                name: `아이템 ${idx + 1}`,
                clickCount: Math.max(1, (Math.min(topN, 20) - idx) * 2),
            })),
            d1RetentionSummary: {
                eligibleUsers: 22,
                retainedUsers: 15,
                d1RetentionRate: 68.18,
            },
            d1RetentionTrend: fillDailySeries(from, to, [], (iso) => {
                const baseUsers = 10 + (iso.endsWith("01") ? 5 : 0);
                const retainedUsers = Math.round(baseUsers * (0.45 + Math.random() * 0.2));
                return {
                    date: iso,
                    baseUsers,
                    retainedUsers,
                    d1RetentionRate: clampPct((retainedUsers / Math.max(1, baseUsers)) * 100),
                };
            }),
        },
    };

    return demo as AdminDashboardOverviewDto;
}

/* ---------------- UI ---------------- */

function Segmented({
                       value,
                       onChange,
                       items,
                   }: {
    value: string;
    onChange: (v: string) => void;
    items: Array<{ value: string; label: string }>;
}) {
    return (
        <div className="inline-flex rounded-full bg-slate-100 p-1 whitespace-nowrap">
            {items.map((it) => {
                const active = it.value === value;
                return (
                    <button
                        key={it.value}
                        type="button"
                        onClick={() => onChange(it.value)}
                        className={cn(
                            "px-3 py-1.5 text-[12px] font-semibold rounded-full transition",
                            active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}

function DonutKpi({
                      title,
                      badge,
                      valuePct,
                      valueLabel,
                      note,
                      color,
                  }: {
    title: string;
    badge?: string;
    valuePct: number;
    valueLabel: string;
    note?: string;
    color: string;
}) {
    const pct = clampPct(valuePct);
    const data = [
        { name: "value", value: pct },
        { name: "rest", value: 100 - pct },
    ];

    return (
        <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[14px] font-semibold leading-5 text-slate-900 truncate">{title}</div>
                    {note ? <div className="mt-1 text-[12px] leading-4 text-slate-500">{note}</div> : null}
                </div>
                {badge ? (
                    <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{badge}</span>
                ) : null}
            </div>

            <div className="mt-4 flex items-center gap-4">
                <div className="h-[88px] w-[88px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={30}
                                outerRadius={42}
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="transparent"
                            >
                                <Cell fill={color} />
                                <Cell fill={COLORS.gray2} />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="min-w-0">
                    <div className="text-[24px] font-extrabold leading-9 text-slate-900 tabular-nums">{valueLabel}</div>
                </div>
            </div>
        </Card>
    );
}

function EmptyState({ title, desc }: { title: string; desc?: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="text-[14px] font-bold text-slate-800">{title}</div>
            {desc ? <div className="mt-1 text-[12px] text-slate-500">{desc}</div> : null}
        </div>
    );
}

/* ---------------- Page ---------------- */

export default function AdminDashboardPage() {
    const [sp, setSp] = useSearchParams();

    const initialFrom = parseISODate(sp.get("from"));
    const initialTo = parseISODate(sp.get("to"));

    const boot = useMemo(() => {
        if (initialFrom && initialTo) return { from: initialFrom, to: initialTo, preset: "custom" as Preset };
        const r = buildPresetRange("7d");
        return { ...r, preset: "7d" as Preset };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [preset, setPreset] = useState<Preset>(boot.preset);
    const [from, setFrom] = useState<Date>(boot.from);
    const [to, setTo] = useState<Date>(boot.to);

    const [topN, setTopN] = useState<number>(TOPN_DEFAULT);
    const [queryText, setQueryText] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [dto, setDto] = useState<AdminDashboardOverviewDto | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    async function fetchOverview(nextFrom: Date, nextTo: Date, nextTopN: number) {
        setLoading(true);
        setError(null);

        try {
            const res = await adminDashboardApi.getOverview({
                from: toISODate(nextFrom),
                to: toISODate(nextTo),
                topN: nextTopN,
            });

            if (USE_DEMO_WHEN_EMPTY && !hasMeaningfulData(res)) {
                setDto(makeDemo(nextFrom, nextTo, nextTopN));
                setIsDemo(true);
            } else {
                setDto(res);
                setIsDemo(false);
            }
        } catch (e: any) {
            setError(e?.message ?? "요청 실패");
            setDto(makeDemo(nextFrom, nextTo, nextTopN));
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    }

    function applyPreset(p: Preset) {
        setPreset(p);
        if (p === "custom") return;
        const r = buildPresetRange(p);
        setFrom(r.from);
        setTo(r.to);
    }

    function apply() {
        setSp((prev) => {
            const next = new URLSearchParams(prev);
            next.set("from", toISODate(from));
            next.set("to", toISODate(to));
            return next;
        });
        void fetchOverview(from, to, topN);
    }

    function resetToDefault() {
        const r = buildPresetRange("7d");
        setPreset("7d");
        setFrom(r.from);
        setTo(r.to);
        setTopN(TOPN_DEFAULT);
        setQueryText("");

        setSp((prev) => {
            const next = new URLSearchParams(prev);
            next.set("from", toISODate(r.from));
            next.set("to", toISODate(r.to));
            return next;
        });

        void fetchOverview(r.from, r.to, TOPN_DEFAULT);
    }

    useEffect(() => {
        void fetchOverview(from, to, topN);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void fetchOverview(from, to, topN);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topN]);

    const metrics: any = dto?.metrics;
    const summary: any = metrics?.summary;

    /**
     * ✅ KPI는 rate 필드를 신뢰하지 말고 "카운트 기반"으로 재계산
     * - 백이 rate=0으로 내려줘도 화면은 정상 값 표시
     */
    const kpi = useMemo(() => {
        if (!summary) return null;

        // 세션 종료율: ended / started
        const started = num(summary.startedSessions);
        const ended = num(summary.endedSessions);
        const sessionEndRate = clampPct((ended / Math.max(1, started)) * 100);

        // 추천전환(EMPTY/TOTAL): recoEmpty / (recoEmpty + recoGenerated) 우선
        const recoEmpty = num(summary.recoEmpty);
        const recoGenerated = num(summary.recoGenerated);
        const recoTotalByCounts = recoEmpty + recoGenerated;

        // fallback: totalRecoEvents가 있으면 total로 사용
        const totalRecoEvents = num(summary.totalRecoEvents);
        const recoTotal = recoTotalByCounts > 0 ? recoTotalByCounts : totalRecoEvents;
        const recoEmptyRate = clampPct((recoEmpty / Math.max(1, recoTotal)) * 100);

        // 퍼널: 체크리스트 → 노출
        const checklist = num(summary.funnel?.checklistSubmitted);
        const shown = num(summary.funnel?.recoShown);
        const checklistToShownRate = clampPct((shown / Math.max(1, checklist)) * 100);

        // 퍼널: 노출 → 선택
        const selected = num(summary.funnel?.itemSelected);
        const shownToSelectRate = clampPct((selected / Math.max(1, shown)) * 100);

        return {
            sessionEndRate,
            recoEmptyRate,
            checklistToShownRate,
            shownToSelectRate,

            // note 표시용
            _started: started,
            _ended: ended,
            _recoEmpty: recoEmpty,
            _recoTotal: recoTotal,
            _checklist: checklist,
            _shown: shown,
            _selected: selected,
        };
    }, [summary]);

    const dailySessions = useMemo(() => {
        const rows = (metrics?.dailySessions ?? []) as DailySessionRow[];
        return fillDailySeries(from, to, rows, (iso) => ({
            date: iso,
            sessionEventCount: 0,
            uniqueUserCount: 0,
            errorEventCount: 0,
            errorRate: 0,
        }));
    }, [metrics, from, to]);

    // ✅ errorRate 누락/0이어도 "카운트 기반"으로 보정
    const dailySessionsFixed = useMemo(() => {
        return dailySessions.map((r) => {
            const ev = num(r.sessionEventCount);
            const er = num(r.errorEventCount);
            return { ...r, errorRate: clampPct((er / Math.max(1, ev)) * 100) };
        });
    }, [dailySessions]);

    const dailyClicks = useMemo(() => {
        const rows = (metrics?.dailyClicks ?? []) as DailyClickRow[];
        return fillDailySeries(from, to, rows, (iso) => ({ date: iso, clickCount: 0 }));
    }, [metrics, from, to]);

    const d1Trend = useMemo(() => (metrics?.d1RetentionTrend ?? []) as any[], [metrics]);

    const topClicked = useMemo(() => {
        const list = (metrics?.topClickedItems ?? []) as TopClickedItemRow[];
        const q = queryText.trim().toLowerCase();
        if (!q) return list;
        return list.filter((it) => String(it.itemId).includes(q) || (it.name ?? "").toLowerCase().includes(q));
    }, [metrics, queryText]);

    return (
        <div className="space-y-6">
            {/* Filter */}
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
                        <div>
                            <div className="text-[12px] font-bold text-slate-500 mb-2">FROM</div>
                            <input
                                type="date"
                                value={toISODate(from)}
                                onChange={(e) => {
                                    setPreset("custom");
                                    setFrom(parseISODate(e.target.value) ?? from);
                                }}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                            />
                        </div>

                        <div>
                            <div className="text-[12px] font-bold text-slate-500 mb-2">TO</div>
                            <input
                                type="date"
                                value={toISODate(to)}
                                onChange={(e) => {
                                    setPreset("custom");
                                    setTo(parseISODate(e.target.value) ?? to);
                                }}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                            />
                        </div>

                        <div className="hidden md:block" />
                    </div>

                    <div className="flex items-center gap-2 justify-start lg:justify-end">
                        <Button
                            className="h-12 px-6 rounded-2xl font-extrabold shadow-sm"
                            style={{ background: COLORS.orange, color: "white" }}
                            onClick={apply}
                            disabled={loading}
                        >
                            {loading ? "조회 중" : "적용"}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 px-6 rounded-2xl font-bold"
                            onClick={resetToDefault}
                            disabled={loading}
                        >
                            기본값
                        </Button>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Segmented
                        value={preset}
                        onChange={(v) => applyPreset(v as Preset)}
                        items={[
                            { value: "7d", label: "최근 7일" },
                            { value: "14d", label: "14일" },
                            { value: "30d", label: "30일" },
                            { value: "90d", label: "90일" },
                            { value: "thisMonth", label: "이번 달" },
                            { value: "lastMonth", label: "지난 달" },
                        ]}
                    />

                    {isDemo ? (
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              데모 데이터 표시 중
            </span>
                    ) : null}
                </div>
            </Card>

            {/* KPI */}
            {!kpi || !summary ? (
                <EmptyState title="데이터 없음" desc="조회 조건을 변경하거나, 로그/집계 상태를 확인하세요." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <DonutKpi
                        title="세션 종료율"
                        badge="END / START"
                        valuePct={kpi.sessionEndRate}
                        valueLabel={`${kpi.sessionEndRate.toFixed(2)}%`}
                        color={COLORS.orange}
                        note={`${kpi._ended} / ${kpi._started}`}
                    />
                    <DonutKpi
                        title="추천전환"
                        badge="EMPTY / TOTAL"
                        valuePct={kpi.recoEmptyRate}
                        valueLabel={`${kpi.recoEmptyRate.toFixed(2)}%`}
                        color={COLORS.orange}
                        note={`${kpi._recoEmpty} / ${kpi._recoTotal}`}
                    />
                    <DonutKpi
                        title="퍼널전환"
                        badge="체크리스트 → 노출"
                        valuePct={kpi.checklistToShownRate}
                        valueLabel={`${kpi.checklistToShownRate.toFixed(2)}%`}
                        color={COLORS.navy}
                        note={`${kpi._shown} / ${kpi._checklist}`}
                    />
                    <DonutKpi
                        title="퍼널전환"
                        badge="노출 → 선택"
                        valuePct={kpi.shownToSelectRate}
                        valueLabel={`${kpi.shownToSelectRate.toFixed(2)}%`}
                        color={COLORS.navy}
                        note={`${kpi._selected} / ${kpi._shown}`}
                    />
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Sessions trend */}
                <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm xl:col-span-2">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[14px] font-bold text-slate-900">일별 세션 이벤트 & 오류율</div>
                            <div className="mt-1 text-[12px] text-slate-500">Bar: 세션 이벤트 수 / Line: 오류율(%)</div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {dailySessionsFixed.length} DAYS
            </span>
                    </div>

                    <div className="mt-4 h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailySessionsFixed} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="4 4" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar yAxisId="left" dataKey="sessionEventCount" fill={COLORS.navy} radius={[10, 10, 0, 0]} />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="errorRate"
                                    stroke={COLORS.orange}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Top clicked */}
                <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[14px] font-bold text-slate-900">Top 클릭 아이템</div>
                        </div>

                        <Segmented
                            value={String(topN)}
                            onChange={(v) => setTopN(Number(v))}
                            items={[
                                { value: "5", label: "Top 5" },
                                { value: "10", label: "Top 10" },
                                { value: "20", label: "Top 20" },
                            ]}
                        />
                    </div>

                    <div className="mt-3">
                        <input
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            placeholder="아이템명/ID 검색"
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900"
                        />
                    </div>

                    <div className="mt-4 space-y-2 max-h-[250px] overflow-auto pr-1">
                        {topClicked.length === 0 ? (
                            <EmptyState title="클릭 데이터 없음" desc="기간 내 클릭 로그가 없으면 비어있습니다." />
                        ) : (
                            topClicked.map((it, idx) => (
                                <div
                                    key={`${it.itemId}-${idx}`}
                                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <div className="text-[12px] font-extrabold text-slate-900 truncate">
                                            #{idx + 1} · {it.name ?? "-"}
                                        </div>
                                        <div className="mt-1 text-[11px] font-semibold text-slate-500 tabular-nums">itemId: {String(it.itemId)}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[18px] font-extrabold text-slate-900 tabular-nums">{it.clickCount}</div>
                                        <div className="text-[11px] font-bold text-slate-500">clicks</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4 h-[140px] w-full">
                        <div className="text-[12px] font-bold text-slate-900 mb-2">일별 클릭 추이</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailyClicks} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="4 4" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="clickCount" fill={COLORS.orange} radius={[10, 10, 0, 0]} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Retention */}
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[14px] font-bold text-slate-900">D1 Retention</div>
                        <div className="mt-1 text-[12px] text-slate-500">코호트별 D1 유지율(%)</div>
                    </div>

                    {metrics?.d1RetentionSummary ? (
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              eligible {num(metrics.d1RetentionSummary.eligibleUsers)} / retained {num(metrics.d1RetentionSummary.retainedUsers)} ·{" "}
                            {num(metrics.d1RetentionSummary.d1RetentionRate).toFixed(2)}%
            </span>
                    ) : (
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">no summary</span>
                    )}
                </div>

                <div className="mt-4 h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={d1Trend} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="4 4" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="d1RetentionRate" stroke={COLORS.navy} strokeWidth={2} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Error banner */}
            {error ? (
                <Card className="p-4 rounded-2xl border border-red-100 bg-red-50">
                    <div className="text-[13px] font-extrabold text-red-700">서버 오류</div>
                    <div className="mt-1 text-[12px] text-red-700">{error}</div>
                    <div className="mt-3">
                        <Button variant="outline" className="h-10 rounded-2xl" onClick={() => void fetchOverview(from, to, topN)}>
                            다시 시도
                        </Button>
                    </div>
                </Card>
            ) : null}
        </div>
    );
}