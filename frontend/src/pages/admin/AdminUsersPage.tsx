// src/pages/admin/AdminUsersPage.tsx
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
    Legend,
} from "recharts";

import { Card, Button, Badge, cn } from "@/app/DesignSystem";
import { adminDashboardApi } from "@/lib/api/adminDashboardApi";

/**
 * Admin Users Report v2 (웹 기준)
 * 목표:
 * - “유입(유니크) / 활동량(세션 이벤트) / 품질(오류율) / 유지(D1)”를 한 화면에서 판단
 * - 날짜 프리셋(최근/이번달/지난달) + 직접 입력
 * - 차트는 “상관관계”가 보이게 1개 메인(활동량+유니크+오류율) + 1개 유지(D1)
 * - 표는 운영 친화(정렬/하이라이트/CSV 다운로드)
 *
 * 주의:
 * - 백엔드 overview endpoint가 topN을 요구하므로, 이 페이지에서는 내부 상수로만 전달(필터에서 제거)
 */

type DailySessionRow = {
    date: string; // YYYY-MM-DD
    sessionEventCount: number;
    uniqueUserCount: number;
    errorEventCount: number;
    errorRate: number; // 0~100
};

type D1TrendRow = {
    date: string; // cohort day
    baseUsers: number;
    retainedUsers: number;
    d1RetentionRate: number; // 0~100
};

type OverviewData = {
    meta: { from: string; to: string; generatedAt: string; topN: number };
    metrics: {
        summary: {
            totalSessions: number;
            uniqueUsers: number;
            avgSessionsPerUser: number;
            totalSessionEvents: number;
            errorEvents: number;
            sessionEndRate: number;
            totalClicks: number;
            recoEmptyRate: number;
            returningRate: number;
        };
        dailySessions: DailySessionRow[];
        d1RetentionTrend: D1TrendRow[];
        d1RetentionSummary?: {
            eligibleUsers: number;
            retainedUsers: number;
            d1RetentionRate: number;
        };
    };
};

const COLORS = {
    navy: "#0F1E3D",
    navy2: "#162B55",
    orange: "#F17A2A",
    slate: "#64748B",
    gray: "#E2E8F0",
    bg: "#F8FAFC",
    danger: "#EF4444",
};

const TOPN_INTERNAL = 10;

// 운영 기준(원하면 프로젝트 상황에 맞춰 조정)
const THRESHOLDS = {
    errorWarnPct: 3,
    errorDangerPct: 5,
};

type Preset = "7d" | "14d" | "30d" | "90d" | "thisMonth" | "lastMonth" | "custom";
type SortKey = "date" | "uniqueUserCount" | "sessionEventCount" | "errorEventCount" | "errorRate";
type SortDir = "asc" | "desc";

/* ---------------- date utils ---------------- */

function toISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function parseISODate(s?: string | null) {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function buildPresetRange(p: Preset): { from: Date; to: Date } {
    const today = new Date();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (p === "thisMonth") return { from: startOfMonth(to), to };
    if (p === "lastMonth") {
        const last = new Date(to.getFullYear(), to.getMonth() - 1, 1);
        return { from: startOfMonth(last), to: endOfMonth(last) };
    }

    const days = p === "7d" ? 6 : p === "14d" ? 13 : p === "30d" ? 29 : p === "90d" ? 89 : 13;
    return { from: addDays(to, -days), to };
}

function clampPct(x: number) {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(100, x));
}

function fillDailySeries(from: Date, to: Date, rows: DailySessionRow[]) {
    const map = new Map<string, DailySessionRow>();
    rows.forEach((r) => map.set(r.date, r));
    const out: DailySessionRow[] = [];
    for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
        const iso = toISODate(d);
        out.push(
            map.get(iso) ?? {
                date: iso,
                sessionEventCount: 0,
                uniqueUserCount: 0,
                errorEventCount: 0,
                errorRate: 0,
            }
        );
    }
    return out;
}

/* ---------------- UI bits ---------------- */

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
                        onClick={() => onChange(it.value)}
                        className={cn(
                            "px-3 py-1.5 text-[12px] font-semibold rounded-full transition",
                            active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                        )}
                        type="button"
                    >
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}

function StatusPill({ level, text }: { level: "ok" | "warn" | "danger"; text: string }) {
    const cls =
        level === "ok"
            ? "bg-slate-100 text-slate-700"
            : level === "warn"
                ? "bg-orange-50 text-orange-700 border border-orange-100"
                : "bg-red-50 text-red-700 border border-red-100";
    return <span className={cn("text-[11px] font-bold px-2 py-1 rounded-full", cls)}>{text}</span>;
}

function KPI({
                 title,
                 value,
                 subLeft,
                 subRight,
                 status,
             }: {
    title: string;
    value: React.ReactNode;
    subLeft?: React.ReactNode;
    subRight?: React.ReactNode;
    status?: React.ReactNode;
}) {
    return (
        <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[12px] font-extrabold tracking-widest text-slate-500">{title}</div>
                    <div className="mt-2 text-[28px] font-extrabold text-slate-900 tabular-nums leading-9">{value}</div>
                </div>
                {status ? <div className="shrink-0">{status}</div> : null}
            </div>
            {(subLeft || subRight) && (
                <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-[12px] text-slate-500">{subLeft}</div>
                    <div className="text-[12px] text-slate-500 text-right">{subRight}</div>
                </div>
            )}
        </Card>
    );
}

function EmptyBlock({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="text-[14px] font-extrabold text-slate-900">{title}</div>
            <div className="mt-1 text-[12px] text-slate-500">{desc}</div>
        </div>
    );
}

/* ---------------- demo fallback (차트 안 깨지게) ---------------- */

function hasMeaningfulData(d: OverviewData | null) {
    if (!d) return false;
    const s = d.metrics?.summary;
    if (!s) return false;
    const sum =
        (s.uniqueUsers ?? 0) +
        (s.totalSessions ?? 0) +
        (s.totalSessionEvents ?? 0) +
        (s.errorEvents ?? 0) +
        (d.metrics?.dailySessions?.length ?? 0);
    return sum > 0;
}

function makeDemo(from: Date, to: Date): OverviewData {
    const daily: DailySessionRow[] = [];
    let totalEvents = 0;
    let totalErrors = 0;

    let i = 0;
    for (let d = new Date(from); d <= to; d = addDays(d, 1), i++) {
        const base = 90 + (i % 7) * 15;
        const spike = i === Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000) - 2) ? 380 : 0;
        const sessionEventCount = base + spike;
        const uniqueUserCount = 4 + (i % 3);
        const err = Math.max(0, Math.round(sessionEventCount * (0.025 + (i % 4) * 0.004)));

        totalEvents += sessionEventCount;
        totalErrors += err;

        daily.push({
            date: toISODate(d),
            sessionEventCount,
            uniqueUserCount,
            errorEventCount: err,
            errorRate: clampPct((err / Math.max(1, sessionEventCount)) * 100),
        });
    }

    const avgErr = clampPct((totalErrors / Math.max(1, totalEvents)) * 100);

    return {
        meta: { from: toISODate(from), to: toISODate(to), generatedAt: new Date().toISOString(), topN: TOPN_INTERNAL },
        metrics: {
            summary: {
                totalSessions: Math.round(totalEvents * 0.55),
                uniqueUsers: 8,
                avgSessionsPerUser: Math.round((totalEvents * 0.55) / 8),
                totalSessionEvents: totalEvents,
                errorEvents: totalErrors,
                sessionEndRate: 61.2,
                totalClicks: 22,
                recoEmptyRate: 9.4,
                returningRate: 68.2,
            },
            dailySessions: daily,
            d1RetentionTrend: daily
                .filter((_, idx) => idx % 3 === 0)
                .map((r) => {
                    const baseUsers = 12 + (Number(r.date.slice(-2)) % 5);
                    const retainedUsers = Math.max(0, Math.round(baseUsers * (0.5 + Math.random() * 0.18)));
                    return {
                        date: r.date,
                        baseUsers,
                        retainedUsers,
                        d1RetentionRate: clampPct((retainedUsers / Math.max(1, baseUsers)) * 100),
                    };
                }),
            d1RetentionSummary: {
                eligibleUsers: 28,
                retainedUsers: 18,
                d1RetentionRate: 64.29,
            },
        },
    };
}

/* ---------------- CSV ---------------- */

function downloadCSV(filename: string, rows: DailySessionRow[]) {
    const header = ["date", "uniqueUserCount", "sessionEventCount", "errorEventCount", "errorRate"];
    const lines = [
        header.join(","),
        ...rows.map((r) => [r.date, r.uniqueUserCount, r.sessionEventCount, r.errorEventCount, r.errorRate].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ---------------- Page ---------------- */

export default function AdminUsersPage() {
    const [sp, setSp] = useSearchParams();

    const boot = useMemo(() => {
        const qFrom = parseISODate(sp.get("from"));
        const qTo = parseISODate(sp.get("to"));

        if (qFrom && qTo) return { from: qFrom, to: qTo, preset: "custom" as Preset };

        const r = buildPresetRange("14d");
        return { ...r, preset: "14d" as Preset };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [preset, setPreset] = useState<Preset>(boot.preset);
    const [from, setFrom] = useState<Date>(boot.from);
    const [to, setTo] = useState<Date>(boot.to);

    // local input (적용 버튼 UX)
    const [fromLocal, setFromLocal] = useState<string>(toISODate(boot.from));
    const [toLocal, setToLocal] = useState<string>(toISODate(boot.to));

    const [data, setData] = useState<OverviewData | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    function applyPreset(p: Preset) {
        setPreset(p);
        if (p === "custom") return;
        const r = buildPresetRange(p);
        setFrom(r.from);
        setTo(r.to);
        setFromLocal(toISODate(r.from));
        setToLocal(toISODate(r.to));
    }

    async function fetchOverview(nextFrom: Date, nextTo: Date) {
        setLoading(true);
        setErr(null);
        try {
            const res = (await adminDashboardApi.getOverview({
                from: toISODate(nextFrom),
                to: toISODate(nextTo),
                topN: TOPN_INTERNAL,
            })) as OverviewData;

            if (!hasMeaningfulData(res)) {
                setData(makeDemo(nextFrom, nextTo));
                setIsDemo(true);
            } else {
                setData(res);
                setIsDemo(false);
            }
        } catch (e: any) {
            setErr(e?.message ?? "요청 실패");
            setData(makeDemo(nextFrom, nextTo));
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    }

    function apply() {
        const f = parseISODate(fromLocal) ?? from;
        const t = parseISODate(toLocal) ?? to;
        setPreset("custom");
        setFrom(f);
        setTo(t);

        // URL은 from/to만 (운영 페이지 공통)
        setSp((prev) => {
            prev.set("from", toISODate(f));
            prev.set("to", toISODate(t));
            return prev;
        });

        fetchOverview(f, t);
    }

    function reset() {
        const r = buildPresetRange("14d");
        setPreset("14d");
        setFrom(r.from);
        setTo(r.to);
        setFromLocal(toISODate(r.from));
        setToLocal(toISODate(r.to));

        setSp((prev) => {
            prev.set("from", toISODate(r.from));
            prev.set("to", toISODate(r.to));
            return prev;
        });

        fetchOverview(r.from, r.to);
    }

    useEffect(() => {
        fetchOverview(from, to);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const daily = useMemo(() => {
        const rows = data?.metrics?.dailySessions ?? [];
        return fillDailySeries(from, to, rows);
    }, [data, from, to]);

    const d1Trend = useMemo(() => data?.metrics?.d1RetentionTrend ?? [], [data]);

    const summary = data?.metrics?.summary;
    const meta = data?.meta;

    const peaks = useMemo(() => {
        if (!daily.length) return { peakUnique: null as DailySessionRow | null, peakError: null as DailySessionRow | null };

        const peakUnique = [...daily].sort((a, b) => b.uniqueUserCount - a.uniqueUserCount)[0] ?? null;
        const peakError = [...daily].sort((a, b) => b.errorRate - a.errorRate)[0] ?? null;
        return { peakUnique, peakError };
    }, [daily]);

    const avgErrorRate = useMemo(() => {
        if (!summary) return 0;
        return clampPct(((summary.errorEvents ?? 0) / Math.max(1, summary.totalSessionEvents ?? 0)) * 100);
    }, [summary]);

    const errorStatus = useMemo(() => {
        const v = avgErrorRate;
        if (v >= THRESHOLDS.errorDangerPct) return { level: "danger" as const, text: `위험 · 오류율 ${v.toFixed(1)}%` };
        if (v >= THRESHOLDS.errorWarnPct) return { level: "warn" as const, text: `주의 · 오류율 ${v.toFixed(1)}%` };
        return { level: "ok" as const, text: `정상 · 오류율 ${v.toFixed(1)}%` };
    }, [avgErrorRate]);

    const chartMaxSessions = useMemo(() => {
        const max = Math.max(0, ...daily.map((r) => r.sessionEventCount));
        // 너무 타이트하면 “꽉 차 보임” -> 10% headroom
        return Math.ceil(max * 1.1);
    }, [daily]);

    const sortedDaily = useMemo(() => {
        const arr = [...daily];
        const dir = sortDir === "asc" ? 1 : -1;

        arr.sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
            return String(av).localeCompare(String(bv)) * dir;
        });

        return arr;
    }, [daily, sortKey, sortDir]);

    function toggleSort(k: SortKey) {
        if (sortKey !== k) {
            setSortKey(k);
            setSortDir(k === "date" ? "desc" : "desc");
            return;
        }
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[18px] font-extrabold text-slate-900">유저 리포트</div>
                    <div className="mt-1 text-[12px] text-slate-500">
                        최근 유입/활동/오류/유지 상태를 빠르게 판단합니다.
                        {isDemo ? <span className="ml-2 font-bold text-orange-700">표시용 데모 데이터</span> : null}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="slate">V2</Badge>
                    <Badge variant="slate">OVERVIEW 1-CALL</Badge>
                    <Badge variant="slate">/ADMIN/USERS</Badge>
                </div>
            </div>

            {/* Filter */}
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* left: dates */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div>
                            <div className="text-[12px] font-bold text-slate-500 mb-2">FROM</div>
                            <input
                                type="date"
                                value={fromLocal}
                                onChange={(e) => {
                                    setPreset("custom");
                                    setFromLocal(e.target.value);
                                }}
                                className="h-12 w-[200px] rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                            />
                        </div>
                        <div>
                            <div className="text-[12px] font-bold text-slate-500 mb-2">TO</div>
                            <input
                                type="date"
                                value={toLocal}
                                onChange={(e) => {
                                    setPreset("custom");
                                    setToLocal(e.target.value);
                                }}
                                className="h-12 w-[200px] rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                            />
                        </div>
                    </div>

                    {/* right: presets + actions */}
                    <div className="flex flex-col gap-3 lg:items-end">
                        <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
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
                                    { value: "custom", label: "직접" },
                                ]}
                            />
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
                            <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold" onClick={reset} disabled={loading}>
                                기본값
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 px-6 rounded-2xl font-bold"
                                onClick={() => fetchOverview(from, to)}
                                disabled={loading}
                            >
                                새로고침
                            </Button>
                        </div>

                        <div className="text-[12px] leading-4 text-slate-500">
                            기준: {meta?.from ?? toISODate(from)} ~ {meta?.to ?? toISODate(to)} (KST 집계) · 생성:{" "}
                            {meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString() : "-"}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Error banner */}
            {err ? (
                <Card className="p-4 rounded-2xl border border-red-100 bg-red-50">
                    <div className="text-[13px] font-extrabold text-red-700">서버 오류</div>
                    <div className="mt-1 text-[12px] text-red-700">{err}</div>
                    <div className="mt-3">
                        <Button variant="outline" className="h-10 rounded-2xl" onClick={() => fetchOverview(from, to)}>
                            다시 시도
                        </Button>
                    </div>
                </Card>
            ) : null}

            {/* KPI */}
            {!summary ? (
                <EmptyBlock title="데이터 없음" desc="조회 조건을 변경하거나, 로그/집계 상태를 확인하세요." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <KPI
                        title="유니크 유저"
                        value={summary.uniqueUsers ?? 0}
                        subLeft={peaks.peakUnique ? `피크: ${peaks.peakUnique.date} (${peaks.peakUnique.uniqueUserCount})` : "피크: -"}
                        status={<StatusPill level="ok" text="유입" />}
                    />
                    <KPI
                        title="활동량(세션 이벤트)"
                        value={summary.totalSessionEvents ?? 0}
                        subLeft={`총 세션 ${summary.totalSessions ?? 0}`}
                        subRight={`평균 세션/유저 ${summary.avgSessionsPerUser ?? 0}`}
                        status={<StatusPill level="ok" text="활동" />}
                    />
                    <KPI
                        title="오류율(평균)"
                        value={`${avgErrorRate.toFixed(2)}%`}
                        subLeft={peaks.peakError ? `피크: ${peaks.peakError.date} (${peaks.peakError.errorRate.toFixed(1)}%)` : "피크: -"}
                        subRight={`오류 이벤트 ${summary.errorEvents ?? 0}`}
                        status={<StatusPill level={errorStatus.level} text={errorStatus.text} />}
                    />
                    <KPI
                        title="D1 리텐션"
                        value={`${data?.metrics?.d1RetentionSummary?.d1RetentionRate?.toFixed(2) ?? "0.00"}%`}
                        subLeft={
                            data?.metrics?.d1RetentionSummary
                                ? `eligible ${data.metrics.d1RetentionSummary.eligibleUsers} / retained ${data.metrics.d1RetentionSummary.retainedUsers}`
                                : "summary: -"
                        }
                        status={<StatusPill level="ok" text="유지" />}
                    />
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {/* Main: Activity + Users + Error */}
                <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm xl:col-span-2">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[14px] font-extrabold text-slate-900">유입 · 활동 · 오류 상관</div>
                            <div className="mt-1 text-[12px] text-slate-500">
                                Bar: 세션 이벤트 / Line: 유니크 유저 / Line(우측축): 오류율(%)
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="slate">{daily.length} DAYS</Badge>
                            <Badge variant="slate">WEB</Badge>
                        </div>
                    </div>

                    <div className="mt-4 h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={daily} margin={{ top: 10, right: 18, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="4 4" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 11 }}
                                    domain={[0, Math.max(10, chartMaxSessions)]}
                                    allowDecimals={false}
                                />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="sessionEventCount"
                                    name="세션 이벤트"
                                    fill={COLORS.navy}
                                    radius={[10, 10, 0, 0]}
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="uniqueUserCount"
                                    name="유니크 유저"
                                    stroke={COLORS.slate}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="errorRate"
                                    name="오류율(%)"
                                    stroke={COLORS.orange}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* D1 Retention */}
                <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[14px] font-extrabold text-slate-900">D1 Retention</div>
                            <div className="mt-1 text-[12px] text-slate-500">코호트 D1 유지율(%) 추이</div>
                        </div>
                        <Badge variant="slate">{d1Trend.length} COHORTS</Badge>
                    </div>

                    {d1Trend.length === 0 ? (
                        <div className="mt-4">
                            <EmptyBlock title="리텐션 데이터 없음" desc="기간 내 cohort가 없을 수 있습니다. (정상 케이스)" />
                        </div>
                    ) : (
                        <div className="mt-4 h-[340px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={d1Trend} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="4 4" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(v: any, k: any) => {
                                            if (k === "d1RetentionRate") return [`${Number(v).toFixed(2)}%`, "D1 리텐션"];
                                            return [v, k];
                                        }}
                                        labelFormatter={(l: any) => `cohort: ${l}`}
                                    />
                                    <Line type="monotone" dataKey="d1RetentionRate" stroke={COLORS.navy} strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            {/* Table */}
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-[14px] font-extrabold text-slate-900">일자별 유저/오류 리포트</div>
                        <div className="mt-1 text-[12px] text-slate-500">
                            오류율 {THRESHOLDS.errorWarnPct}% 이상은 주의, {THRESHOLDS.errorDangerPct}% 이상은 위험으로 강조합니다.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="h-11 px-4 rounded-2xl font-bold"
                            onClick={() => downloadCSV(`admin_users_${meta?.from ?? toISODate(from)}_${meta?.to ?? toISODate(to)}.csv`, sortedDaily)}
                            disabled={!sortedDaily.length}
                        >
                            CSV 다운로드
                        </Button>
                        <Badge variant="slate">
                            {meta?.from ?? toISODate(from)} ~ {meta?.to ?? toISODate(to)}
                        </Badge>
                    </div>
                </div>

                {!sortedDaily.length ? (
                    <div className="mt-4">
                        <EmptyBlock title="데이터 없음" desc="해당 기간에 세션 로그가 없을 수 있습니다. (정상 케이스)" />
                    </div>
                ) : (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("date")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        일자 {sortKey === "date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("uniqueUserCount")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        유니크 {sortKey === "uniqueUserCount" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("sessionEventCount")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        세션 이벤트 {sortKey === "sessionEventCount" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("errorEventCount")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        에러 이벤트 {sortKey === "errorEventCount" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("errorRate")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        오류율 {sortKey === "errorRate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {sortedDaily.map((r) => {
                                const rate = clampPct(r.errorRate);
                                const level =
                                    rate >= THRESHOLDS.errorDangerPct ? "danger" : rate >= THRESHOLDS.errorWarnPct ? "warn" : "ok";

                                const rowBg =
                                    level === "danger"
                                        ? "bg-red-50"
                                        : level === "warn"
                                            ? "bg-orange-50"
                                            : "bg-white";

                                return (
                                    <tr key={r.date} className={cn("border-t border-slate-100", rowBg)}>
                                        <td className="px-4 py-3 font-semibold text-slate-900">{r.date}</td>
                                        <td className="px-4 py-3 text-right font-extrabold text-slate-900 tabular-nums">
                                            {r.uniqueUserCount}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">{r.sessionEventCount}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{r.errorEventCount}</td>
                                        <td className="px-4 py-3 text-right font-extrabold tabular-nums">
                        <span className={cn(level === "danger" ? "text-red-700" : level === "warn" ? "text-orange-700" : "text-slate-900")}>
                          {rate.toFixed(2)}%
                        </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Next step note */}
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[13px] font-extrabold text-slate-900">다음 단계(개별 드릴다운)</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-slate-600">
                    <li>
                        지금 페이지는 overview 기반 “집계 리포트”입니다. 유저별 상세(세션키/유저ID별)로 내려가려면 백엔드에{" "}
                        <b>/api/admin/users/activity</b> 같은 user-level endpoint가 추가로 필요합니다.
                    </li>
                    <li>운영 UX는 “표의 특정 날짜 클릭 → 상세 모달(최근 이벤트/최근 에러/최근 클릭)” 구조가 가장 효율적입니다.</li>
                </ul>
            </Card>
        </div>
    );
}