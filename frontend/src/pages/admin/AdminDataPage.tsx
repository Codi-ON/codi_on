// src/pages/admin/AdminDataPage.tsx
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

/* ---------------- types ---------------- */

type MonthlyTopItem = {
    rank: number;
    itemId: number | string;
    name?: string | null;
    clickCount: number;
};

type MonthlyRow = {
    month: string; // YYYY-MM
    totalSessions: number;
    uniqueUsers: number;
    avgSessionsPerUser: number;

    totalSessionEvents: number;
    totalClicks: number;
    totalRecoEvents: number;
    errorEvents: number;

    sessionEndRate: number; // 0~100
    recoEmptyRate: number; // 0~100

    topClickedItems?: MonthlyTopItem[];
};

type MonthlyResponse = {
    meta?: { region: string; timezone: string; generatedAt: string };
    range?: { fromMonth: string; toMonth: string; topN: number };
    rows: MonthlyRow[];
};

/* ---------------- constants ---------------- */

const COLORS = {
    navy: "#0F1E3D",
    slate: "#64748B",
    orange: "#F17A2A",
    danger: "#EF4444",
};

const THRESHOLDS = {
    errorWarnPct: 3,
    errorDangerPct: 5,
    emptyWarnPct: 15,
    emptyDangerPct: 25,
};

/* ---------------- utils ---------------- */

function clampInt(v: string | null, fallback: number, min: number, max: number) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
}

function toYYYYMM(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(date: Date, m: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + m);
    return d;
}

function formatNumber(n: number) {
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("ko-KR");
}

function formatPercent(n: number) {
    if (!Number.isFinite(n)) return "-";
    return `${n.toFixed(2)}%`;
}

function pctDelta(curr: number, prev: number) {
    if (!Number.isFinite(curr) || !Number.isFinite(prev)) return null;
    const d = curr - prev;
    const sign = d > 0 ? "+" : "";
    return `${sign}${d.toFixed(2)}%p`;
}

function numDelta(curr: number, prev: number) {
    if (!Number.isFinite(curr) || !Number.isFinite(prev)) return null;
    const d = curr - prev;
    const sign = d > 0 ? "+" : "";
    return `${sign}${d.toLocaleString("ko-KR")}`;
}

/* ---------------- UI bits ---------------- */

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
                 hint,
                 subLeft,
                 subRight,
                 status,
             }: {
    title: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    subLeft?: React.ReactNode;
    subRight?: React.ReactNode;
    status?: React.ReactNode;
}) {
    return (
        <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[12px] font-extrabold tracking-widest text-slate-500">{title}</div>
                    {hint ? <div className="mt-1 text-[12px] font-medium text-slate-400">{hint}</div> : null}
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

/* ---------------- preset ---------------- */

type Preset = "6m" | "12m" | "24m" | "thisYear" | "custom";

function buildPresetMonths(p: Preset) {
    const now = new Date();
    const toMonth = toYYYYMM(now);

    if (p === "thisYear") {
        const fromMonth = `${now.getFullYear()}-01`;
        return { fromMonth, toMonth };
    }
    if (p === "12m") return { fromMonth: toYYYYMM(addMonths(now, -11)), toMonth };
    if (p === "24m") return { fromMonth: toYYYYMM(addMonths(now, -23)), toMonth };
    return { fromMonth: toYYYYMM(addMonths(now, -5)), toMonth };
}

/* ---------------- sort ---------------- */

type SortKey =
    | "month"
    | "totalSessions"
    | "uniqueUsers"
    | "totalClicks"
    | "errorEvents"
    | "sessionEndRate"
    | "recoEmptyRate";
type SortDir = "asc" | "desc";

/* ---------------- Page ---------------- */

export default function AdminDataPage() {
    const [sp, setSp] = useSearchParams();

    const defaults = useMemo(() => {
        const r = buildPresetMonths("6m");
        return { ...r, topN: 10 };
    }, []);

    const fromMonth = sp.get("fromMonth") ?? defaults.fromMonth;
    const toMonth = sp.get("toMonth") ?? defaults.toMonth;
    const topN = clampInt(sp.get("topN"), defaults.topN, 1, 50);

    const query = useMemo(() => ({ fromMonth, toMonth, topN }), [fromMonth, toMonth, topN]);

    const [preset, setPreset] = useState<Preset>("custom");
    const [localFrom, setLocalFrom] = useState(fromMonth);
    const [localTo, setLocalTo] = useState(toMonth);
    const [localTopN, setLocalTopN] = useState(String(topN));

    const [data, setData] = useState<MonthlyResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    const [sortKey, setSortKey] = useState<SortKey>("month");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    function applyPreset(p: Preset) {
        setPreset(p);
        if (p === "custom") return;
        const r = buildPresetMonths(p);
        setLocalFrom(r.fromMonth);
        setLocalTo(r.toMonth);
    }

    async function fetchMonthly(q: { fromMonth: string; toMonth: string; topN: number }) {
        setLoading(true);
        setErr(null);
        try {
            const res = (await adminDashboardApi.getMonthly(q)) as MonthlyResponse;
            setData(res);
        } catch (e: any) {
            setErr(e?.message ?? "월별 데이터를 불러오지 못했습니다.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    function apply() {
        const next = {
            fromMonth: localFrom,
            toMonth: localTo,
            topN: clampInt(localTopN, 10, 1, 50),
        };

        setSp({
            fromMonth: next.fromMonth,
            toMonth: next.toMonth,
            topN: String(next.topN),
        });

        fetchMonthly(next);
    }

    function reset() {
        setPreset("6m");
        const r = buildPresetMonths("6m");

        setLocalFrom(r.fromMonth);
        setLocalTo(r.toMonth);
        setLocalTopN(String(defaults.topN));

        setSp({
            fromMonth: r.fromMonth,
            toMonth: r.toMonth,
            topN: String(defaults.topN),
        });

        fetchMonthly({ fromMonth: r.fromMonth, toMonth: r.toMonth, topN: defaults.topN });
    }

    useEffect(() => {
        // URL 기준 초기 로딩
        setLocalFrom(fromMonth);
        setLocalTo(toMonth);
        setLocalTopN(String(topN));
        fetchMonthly({ fromMonth, toMonth, topN });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rows = useMemo(() => data?.rows ?? [], [data]);

    const sortedRows = useMemo(() => {
        const arr = [...rows];
        const dir = sortDir === "asc" ? 1 : -1;
        arr.sort((a, b) => {
            const av = (a as any)[sortKey];
            const bv = (b as any)[sortKey];
            if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
            return String(av).localeCompare(String(bv)) * dir;
        });
        return arr;
    }, [rows, sortKey, sortDir]);

    function toggleSort(k: SortKey) {
        if (sortKey !== k) {
            setSortKey(k);
            setSortDir("desc");
            return;
        }
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }

    const latest = useMemo(() => {
        if (!rows.length) return null;
        return [...rows].sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;
    }, [rows]);

    const prev = useMemo(() => {
        const sorted = [...rows].sort((a, b) => b.month.localeCompare(a.month));
        return sorted.length >= 2 ? sorted[1] : null;
    }, [rows]);

    const freshness = useMemo(() => {
        const latestMonth = latest?.month ?? null;
        if (!latestMonth) return { latestMonth: null as string | null, badge: null as string | null };

        if (latestMonth < toMonth) return { latestMonth, badge: `지연(최신 ${toMonth} 대비)` };
        return { latestMonth, badge: "최신" };
    }, [latest, toMonth]);

    const qualityStatus = useMemo(() => {
        const errPct =
            latest?.totalSessionEvents > 0
                ? (latest.errorEvents / Math.max(1, latest.totalSessionEvents)) * 100
                : 0;

        const emptyPct = latest?.recoEmptyRate ?? 0;

        const errLevel =
            errPct >= THRESHOLDS.errorDangerPct ? "danger" : errPct >= THRESHOLDS.errorWarnPct ? "warn" : "ok";
        const emptyLevel =
            emptyPct >= THRESHOLDS.emptyDangerPct ? "danger" : emptyPct >= THRESHOLDS.emptyWarnPct ? "warn" : "ok";

        return { errPct, errLevel, emptyPct, emptyLevel };
    }, [latest]);

    async function downloadExcel() {
        try {
            setDownloading(true);

            const raw = await adminDashboardApi.downloadMonthlyExcel(query);

            const blob =
                raw instanceof Blob
                    ? raw
                    : new Blob([raw as any], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `admin-monthly_${query.fromMonth}_to_${query.toMonth}_top${query.topN}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } finally {
            setDownloading(false);
        }
    }

    const chartActivity = useMemo(
        () =>
            [...rows]
                .sort((a, b) => a.month.localeCompare(b.month))
                .map((r) => ({
                    month: r.month,
                    sessions: r.totalSessions,
                    users: r.uniqueUsers,
                })),
        [rows]
    );

    const chartQuality = useMemo(
        () =>
            [...rows]
                .sort((a, b) => a.month.localeCompare(b.month))
                .map((r) => ({
                    month: r.month,
                    errorRate: r.totalSessionEvents > 0 ? (r.errorEvents / Math.max(1, r.totalSessionEvents)) * 100 : 0,
                    recoEmptyRate: r.recoEmptyRate ?? 0,
                    sessionEndRate: r.sessionEndRate ?? 0,
                })),
        [rows]
    );

    const meta = data?.meta;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[18px] font-extrabold text-slate-900">데이터 리포트</div>
                    <div className="mt-1 text-[12px] text-slate-500">월별 집계(활동/품질) 확인 및 운영용 엑셀 추출.</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="slate">V2</Badge>
                    <Badge variant="slate">/ADMIN/DATA</Badge>

                    {freshness.latestMonth ? <Badge variant="slate">최근 {freshness.latestMonth}</Badge> : null}
                    {freshness.badge ? <Badge variant="slate">{freshness.badge}</Badge> : null}

                    <Button
                        className="h-10 px-4 rounded-2xl font-extrabold shadow-sm"
                        style={{ background: COLORS.orange, color: "white" }}
                        onClick={downloadExcel}
                        disabled={downloading || loading}
                    >
                        {downloading ? "엑셀 생성 중" : "엑셀 다운로드"}
                    </Button>
                </div>
            </div>

            {/* Filter */}
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    {/* inputs */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div>
                            <div className="text-[12px] font-bold text-slate-500 mb-2">FROM (월)</div>
                            <input
                                type="month"
                                value={localFrom}
                                onChange={(e) => {
                                    setPreset("custom");
                                    setLocalFrom(e.target.value);
                                }}
                                className="h-12 w-[220px] rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                            />
                        </div>

                        <div>
                            <div className="text-[12px] font-bold text-slate-500 mb-2">TO (월)</div>
                            <input
                                type="month"
                                value={localTo}
                                onChange={(e) => {
                                    setPreset("custom");
                                    setLocalTo(e.target.value);
                                }}
                                className="h-12 w-[220px] rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                            />
                        </div>

                        <div>
                            <div className="text-[12px] font-bold text-slate-500 mb-2">TOP N</div>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={localTopN}
                                onChange={(e) => setLocalTopN(e.target.value)}
                                className="h-12 w-[120px] rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                            />
                        </div>
                    </div>

                    {/* presets + actions */}
                    <div className="flex flex-col gap-3 lg:items-end">
                        <div className="flex flex-wrap items-center gap-2">
                            {(
                                [
                                    { v: "6m", l: "최근 6개월" },
                                    { v: "12m", l: "12개월" },
                                    { v: "24m", l: "24개월" },
                                    { v: "thisYear", l: "올해" },
                                    { v: "custom", l: "직접" },
                                ] as Array<{ v: Preset; l: string }>
                            ).map((it) => {
                                const active = it.v === preset;
                                return (
                                    <button
                                        key={it.v}
                                        type="button"
                                        onClick={() => applyPreset(it.v)}
                                        className={cn(
                                            "px-3 py-2 text-[12px] font-bold rounded-full transition whitespace-nowrap",
                                            active
                                                ? "bg-slate-900 text-white shadow-sm"
                                                : "bg-slate-100 text-slate-600 hover:text-slate-900"
                                        )}
                                    >
                                        {it.l}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2">
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
                                onClick={() => fetchMonthly(query)}
                                disabled={loading}
                            >
                                새로고침
                            </Button>
                        </div>

                        <div className="text-[12px] leading-4 text-slate-500">
                            기준: {data?.range?.fromMonth ?? fromMonth} ~ {data?.range?.toMonth ?? toMonth} · TOPN{" "}
                            {data?.range?.topN ?? topN} · 생성:{" "}
                            {meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString("ko-KR") : "-"} · region{" "}
                            {meta?.region ?? "-"} · TZ {meta?.timezone ?? "-"}
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
                        <Button variant="outline" className="h-10 rounded-2xl" onClick={() => fetchMonthly(query)}>
                            다시 시도
                        </Button>
                    </div>
                </Card>
            ) : null}

            {/* KPI */}
            {!latest ? (
                <EmptyBlock title="데이터 없음" desc="해당 기간에 월별 집계가 없을 수 있습니다. (로그/집계 스케줄 확인)" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <KPI
                        title="최근 월 세션"
                        hint={`기준 월: ${latest.month}`}
                        value={formatNumber(latest.totalSessions)}
                        subLeft={`세션 이벤트 ${formatNumber(latest.totalSessionEvents)}`}
                        subRight={prev ? `전월 대비 ${numDelta(latest.totalSessions, prev.totalSessions)}` : "전월: -"}
                        status={<StatusPill level="ok" text="활동" />}
                    />

                    <KPI
                        title="최근 월 유니크"
                        hint={`avg 세션/유저 ${latest.avgSessionsPerUser}`}
                        value={formatNumber(latest.uniqueUsers)}
                        subLeft={`클릭 ${formatNumber(latest.totalClicks)}`}
                        subRight={prev ? `전월 대비 ${numDelta(latest.uniqueUsers, prev.uniqueUsers)}` : "전월: -"}
                        status={<StatusPill level="ok" text="유입" />}
                    />

                    <KPI
                        title="오류율(최근 월)"
                        hint={`${formatNumber(latest.errorEvents)} / ${formatNumber(latest.totalSessionEvents)} (에러/세션이벤트)`}
                        value={formatPercent(qualityStatus.errPct)}
                        subLeft={
                            prev
                                ? `전월 대비 ${
                                    pctDelta(
                                        qualityStatus.errPct,
                                        prev.totalSessionEvents > 0 ? (prev.errorEvents / Math.max(1, prev.totalSessionEvents)) * 100 : 0
                                    ) ?? "-"
                                }`
                                : "전월: -"
                        }
                        subRight={`에러 이벤트 ${formatNumber(latest.errorEvents)}`}
                        status={
                            <StatusPill
                                level={qualityStatus.errLevel}
                                text={
                                    qualityStatus.errLevel === "danger"
                                        ? `위험 · ${qualityStatus.errPct.toFixed(1)}%`
                                        : qualityStatus.errLevel === "warn"
                                            ? `주의 · ${qualityStatus.errPct.toFixed(1)}%`
                                            : `정상 · ${qualityStatus.errPct.toFixed(1)}%`
                                }
                            />
                        }
                    />

                    <KPI
                        title="빈 추천율(최근 월)"
                        hint="추천 결과가 비어있는 비율(%)"
                        value={formatPercent(qualityStatus.emptyPct)}
                        subLeft={prev ? `전월 대비 ${pctDelta(latest.recoEmptyRate, prev.recoEmptyRate) ?? "-"}` : "전월: -"}
                        subRight={`Session End ${formatPercent(latest.sessionEndRate)}`}
                        status={
                            <StatusPill
                                level={qualityStatus.emptyLevel}
                                text={
                                    qualityStatus.emptyLevel === "danger"
                                        ? `위험 · ${qualityStatus.emptyPct.toFixed(1)}%`
                                        : qualityStatus.emptyLevel === "warn"
                                            ? `주의 · ${qualityStatus.emptyPct.toFixed(1)}%`
                                            : `정상 · ${qualityStatus.emptyPct.toFixed(1)}%`
                                }
                            />
                        }
                    />
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {/* Activity */}
                <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[14px] font-extrabold text-slate-900">활동 트렌드</div>
                            <div className="mt-1 text-[12px] text-slate-500">Bar: 세션 / Line: 유니크</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="slate">{chartActivity.length} MONTHS</Badge>
                            <Badge variant="slate">ACTIVITY</Badge>
                        </div>
                    </div>

                    {chartActivity.length === 0 ? (
                        <div className="mt-4">
                            <EmptyBlock title="차트 데이터 없음" desc="해당 기간에 월별 집계가 없습니다." />
                        </div>
                    ) : (
                        <div className="mt-4 h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartActivity} margin={{ top: 10, right: 18, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="4 4" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="sessions" name="세션" fill={COLORS.navy} radius={[10, 10, 0, 0]} />
                                    <Line type="monotone" dataKey="users" name="유니크" stroke={COLORS.slate} strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                {/* Quality */}
                <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[14px] font-extrabold text-slate-900">품질 트렌드</div>
                            <div className="mt-1 text-[12px] text-slate-500">오류율/빈추천율/세션종료율(%)</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="slate">{chartQuality.length} MONTHS</Badge>
                            <Badge variant="slate">QUALITY</Badge>
                        </div>
                    </div>

                    {chartQuality.length === 0 ? (
                        <div className="mt-4">
                            <EmptyBlock title="차트 데이터 없음" desc="해당 기간에 월별 집계가 없습니다." />
                        </div>
                    ) : (
                        <div className="mt-4 h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartQuality} margin={{ top: 10, right: 18, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="4 4" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(v: any, k: any) => {
                                            if (typeof v === "number") return [`${v.toFixed(2)}%`, k];
                                            return [v, k];
                                        }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="errorRate" name="오류율(%)" stroke={COLORS.danger} strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="recoEmptyRate" name="빈추천율(%)" stroke={COLORS.orange} strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="sessionEndRate" name="Session End(%)" stroke={COLORS.slate} strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            {/* Table */}
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-[14px] font-extrabold text-slate-900">월별 상세</div>
                        <div className="mt-1 text-[12px] text-slate-500">
                            오류율 {THRESHOLDS.errorWarnPct}% 이상 주의 / {THRESHOLDS.errorDangerPct}% 이상 위험 · 빈추천율{" "}
                            {THRESHOLDS.emptyWarnPct}% 이상 주의 / {THRESHOLDS.emptyDangerPct}% 이상 위험
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="slate">
                            {data?.range?.fromMonth ?? fromMonth} ~ {data?.range?.toMonth ?? toMonth}
                        </Badge>
                        <Button
                            variant="outline"
                            className="h-11 px-4 rounded-2xl font-bold"
                            onClick={downloadExcel}
                            disabled={downloading || loading}
                        >
                            {downloading ? "엑셀 생성 중" : "엑셀 다운로드"}
                        </Button>
                    </div>
                </div>

                {sortedRows.length === 0 ? (
                    <div className="mt-4">
                        <EmptyBlock title="월별 데이터 없음" desc="해당 기간에 집계 결과가 없습니다. (정상 케이스)" />
                    </div>
                ) : (
                    <div className="mt-4 overflow-auto rounded-2xl border border-slate-100 bg-white">
                        <table className="min-w-[1100px] w-full text-[13px]">
                            <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 text-left whitespace-nowrap">
                                    <button type="button" onClick={() => toggleSort("month")} className="font-extrabold hover:text-slate-900">
                                        Month {sortKey === "month" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>

                                <th className="px-4 py-3 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("totalSessions")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        Sessions {sortKey === "totalSessions" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>

                                <th className="px-4 py-3 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("uniqueUsers")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        Users {sortKey === "uniqueUsers" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>

                                <th className="px-4 py-3 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("totalClicks")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        Clicks {sortKey === "totalClicks" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>

                                <th className="px-4 py-3 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("errorEvents")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        Errors {sortKey === "errorEvents" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>

                                <th className="px-4 py-3 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("sessionEndRate")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        End(%) {sortKey === "sessionEndRate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>

                                <th className="px-4 py-3 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("recoEmptyRate")}
                                        className="font-extrabold hover:text-slate-900"
                                    >
                                        Empty(%) {sortKey === "recoEmptyRate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </th>

                                <th className="px-4 py-3 text-left whitespace-nowrap">Top Clicked</th>
                            </tr>
                            </thead>

                            <tbody>
                            {sortedRows.map((r) => {
                                const errRate =
                                    r.totalSessionEvents > 0 ? (r.errorEvents / Math.max(1, r.totalSessionEvents)) * 100 : 0;

                                const errLevel =
                                    errRate >= THRESHOLDS.errorDangerPct ? "danger" : errRate >= THRESHOLDS.errorWarnPct ? "warn" : "ok";
                                const emptyLevel =
                                    r.recoEmptyRate >= THRESHOLDS.emptyDangerPct
                                        ? "danger"
                                        : r.recoEmptyRate >= THRESHOLDS.emptyWarnPct
                                            ? "warn"
                                            : "ok";

                                const rowBg =
                                    errLevel === "danger" || emptyLevel === "danger"
                                        ? "bg-red-50"
                                        : errLevel === "warn" || emptyLevel === "warn"
                                            ? "bg-orange-50"
                                            : "bg-white";

                                return (
                                    <tr key={r.month} className={cn("border-t border-slate-100 align-top", rowBg)}>
                                        <td className="px-4 py-3 font-extrabold text-slate-900 whitespace-nowrap">{r.month}</td>

                                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                                            <div className="font-extrabold text-slate-900">{formatNumber(r.totalSessions)}</div>
                                            <div className="text-[11px] font-medium text-slate-500">events {formatNumber(r.totalSessionEvents)}</div>
                                        </td>

                                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                                            <div className="font-extrabold text-slate-900">{formatNumber(r.uniqueUsers)}</div>
                                            <div className="text-[11px] font-medium text-slate-500">avg {r.avgSessionsPerUser}</div>
                                        </td>

                                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{formatNumber(r.totalClicks)}</td>

                                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                                            <div
                                                className={cn(
                                                    "font-extrabold",
                                                    errLevel === "danger"
                                                        ? "text-red-700"
                                                        : errLevel === "warn"
                                                            ? "text-orange-700"
                                                            : "text-slate-900"
                                                )}
                                            >
                                                {formatNumber(r.errorEvents)}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-500">{errRate.toFixed(2)}%</div>
                                        </td>

                                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{formatPercent(r.sessionEndRate)}</td>

                                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        <span
                            className={cn(
                                emptyLevel === "danger"
                                    ? "text-red-700 font-extrabold"
                                    : emptyLevel === "warn"
                                        ? "text-orange-700 font-extrabold"
                                        : "text-slate-900"
                            )}
                        >
                          {formatPercent(r.recoEmptyRate)}
                        </span>
                                        </td>

                                        <td className="px-4 py-3 min-w-[320px]">
                                            {r.topClickedItems?.length ? (
                                                <div className="space-y-2">
                                                    {r.topClickedItems.slice(0, 3).map((it) => {
                                                        const label = it.name?.trim() ? it.name : "이름 미수집(데이터 품질)";
                                                        return (
                                                            <div
                                                                key={`${r.month}-${it.rank}-${it.itemId}`}
                                                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="text-[11px] font-black text-slate-400">#{it.rank} · itemId {it.itemId}</div>
                                                                    <div className="text-[13px] font-extrabold text-slate-900 truncate">{label}</div>
                                                                </div>
                                                                <div className="text-[13px] font-extrabold text-slate-700 tabular-nums whitespace-nowrap">
                                                                    {formatNumber(it.clickCount)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {r.topClickedItems.length > 3 ? (
                                                        <div className="text-[12px] font-medium text-slate-500">
                                                            외 {r.topClickedItems.length - 3}개
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="text-[12px] font-medium text-slate-500">Top 클릭 없음</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}