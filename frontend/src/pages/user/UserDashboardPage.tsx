// src/pages/user/UserDashboardPage.tsx
import React, { useMemo, useState } from "react";
import { Card } from "../../shared/ui/components/Card";
import { Button } from "../../shared/ui/components/Button";
import {
    Award,
    Zap,
    Thermometer,
    Cpu,
    ChevronLeft,
    ChevronRight,
    Info,
    RefreshCcw,
    Calendar,
    MousePointerClick,
    Sparkles, MessageSquareHeart,
} from "lucide-react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LabelList,
} from "recharts";

import { categoryLabel, ratioToPercentText } from "@/lib/adapters/userDashboardAdapter";
import { useDashboardOverview } from "@/lib/hooks/useDashboard";
import {Tooltip} from "@/shared/ui/components/Tooltip.tsx";


type DonutBasis = "ALL_CLICKS" | "FAVORITED_CLICKS";

/** =========================
 * Theme (한 군데로 고정)
 * ========================= */
const DASHBOARD_THEME = {
    brand: {
        primary: "#F97316",
        navy: "#0F172A",
        slate: "#64748B",
        soft: "#F8FAFC",
    },
    donutColors: ["#0F172A", "#F97316", "#64748B", "#94A3B8", "#CBD5E1"],
    kpi: {
        saved: { ring: "ring-orange-100", bg: "bg-orange-50", fg: "text-orange-600" },
        feedback: { ring: "ring-slate-200", bg: "bg-slate-900", fg: "text-white" },
        rate: { ring: "ring-emerald-100", bg: "bg-emerald-50", fg: "text-emerald-700" },
        model: { ring: "ring-violet-100", bg: "bg-violet-50", fg: "text-violet-700" },
    },
    badge: {
        soft: "bg-slate-50 text-slate-600 border border-slate-200",
        orange: "bg-orange-50 text-orange-700 border border-orange-100",
        navy: "bg-slate-900 text-white border border-slate-900",
    },
    notice: {
        info: "border border-slate-100 bg-slate-50 text-slate-600",
        warn: "border border-amber-100 bg-amber-50 text-amber-800",
        error: "border border-red-100 bg-red-50 text-red-700",
    },
} as const;

/** =========================
 * Utils
 * ========================= */
function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function yyyymm(year: number, month: number) {
    return `${year}년 ${pad2(month)}월`;
}
function formatRange(fromISO: string, toISO: string) {
    const f = `${fromISO.slice(5, 7)}.${fromISO.slice(8, 10)}`;
    const t = `${toISO.slice(5, 7)}.${toISO.slice(8, 10)}`;
    return `${f} ~ ${t}`;
}
function tempText(v: number | null | undefined) {
    // ✅ 0도 표시. null/undefined만 "-"
    if (v === null || v === undefined || !Number.isFinite(v)) return "-";
    return `${Math.round(v)}°`;
}
function percentText(v: number | null | undefined) {
    if (v === null || v === undefined || !Number.isFinite(v)) return "-";
    return `${Math.round(v)}%`;
}
function strategyLabel(v: string | null | undefined) {
    if (!v) return "-";
    if (v === "BLEND_RATIO") return "혼용률 기반";
    if (v === "MATERIAL_RATIO") return "소재 기반";
    return v;
}
function basisLabel(v: DonutBasis) {
    return v === "FAVORITED_CLICKS" ? "찜한 아이템 클릭" : "전체 클릭";
}
function safeRate(numer: number, denom: number) {
    if (!Number.isFinite(numer) || !Number.isFinite(denom) || denom <= 0) return null;
    return (numer / denom) * 100;
}

/** =========================
 * Small UI
 * ========================= */
const SkeletonBlock = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />
);

const EmptyState = ({
                        title,
                        desc,
                        icon,
                    }: {
    title: string;
    desc?: string;
    icon?: React.ReactNode;
}) => (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
        {icon ? <div className="mx-auto mb-2 w-fit text-slate-400">{icon}</div> : null}
        <div className="text-sm font-black text-slate-700">{title}</div>
        {desc ? <div className="mt-1 text-xs font-bold text-slate-500 leading-5">{desc}</div> : null}
    </div>
);

type Help = { title: string; desc: string };

const InfoTip = ({ help }: { help: Help }) => {
    return (
        <Tooltip
            side="bottom"
            align="end"
            content={
                <div className="space-y-1">
                    <div className="text-[11px] font-black text-slate-800">{help.title}</div>
                    <div className="whitespace-pre-line text-[11px] font-bold text-slate-600 leading-5">
                        {help.desc}
                    </div>
                </div>
            }
        >
            <button
                type="button"
                className={[
                    "inline-flex items-center justify-center",
                    "w-9 h-9 rounded-full border border-slate-200 bg-white",
                    "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                    "transition",
                ].join(" ")}
                aria-label={`${help.title} 도움말`}
            >
                <Info size={16} />
            </button>
        </Tooltip>
    );
};

const TopItemRow = ({
                        name,
                        category,
                        count,
                        imageUrl,
                    }: {
    name: string;
    category: string;
    count: number;
    imageUrl: string | null;
}) => (
    <div className="flex items-center gap-3 py-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
            {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300">
                    NO IMG
                </div>
            )}
        </div>

        <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-slate-800 truncate">{name}</div>
            <div className="mt-0.5 text-[11px] font-bold text-slate-500">
        <span className={`inline-flex items-center px-2 h-5 rounded-full ${DASHBOARD_THEME.badge.soft}`}>
          {category}
        </span>
            </div>
        </div>

        <div className="shrink-0 text-xs font-black text-slate-700">{count}</div>
    </div>
);

const UserDashboardPage: React.FC = () => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    // 현재 API는 basis 토글 리패치 미지원 가정 → 표시 토글만 유지
    const [donutBasis, setDonutBasis] = useState<DonutBasis>("ALL_CLICKS");

    const { ui, loading, error, refetch } = useDashboardOverview({
        year,
        month,
        section: "OVERVIEW",
    });

    const rangeText = useMemo(() => {
        if (!ui) return "-";
        return formatRange(ui.range.from, ui.range.to);
    }, [ui]);

    /** =========================
     * Hero
     * ========================= */
    const hero = useMemo(() => {
        if (!ui) {
            return {
                title: "월별 리포트를 불러오는 중입니다.",
                desc: "저장/피드백/클릭 로그가 쌓일수록 통계가 선명해집니다.",
            };
        }
        const s = ui.summary;
        return {
            title: `이번 달 ${s.monthlyOutfitCount}회 저장, 피드백 ${s.feedbackCount}회(${percentText(s.feedbackRate)})`,
            desc: `가장 많이 사용된 추천 모델은 “${strategyLabel(s.mostUsedRecoStrategy)}” 입니다.`,
        };
    }, [ui]);

    /** =========================
     * KPI (데이터로만 만든다)
     * ========================= */
    const kpi = useMemo(() => {
        if (!ui) return null;
        const s = ui.summary;

        return [
            {
                key: "saved",
                label: "저장",
                value: `${s.monthlyOutfitCount}회`,
                sub: `기간 ${rangeText}`,
                icon: Zap,
                tone: DASHBOARD_THEME.kpi.saved,
                help: {
                    title: "저장",
                    desc: "monthlyOutfitCount\n해당 월에 ‘오늘 아웃핏’으로 저장한 횟수입니다.",
                },
            },
            {
                key: "feedback",
                label: "피드백",
                value: `${s.feedbackCount}회`,
                sub: `저장 대비 ${percentText(s.feedbackRate)}`,
                icon: Award,
                tone: DASHBOARD_THEME.kpi.feedback,
                help: {
                    title: "피드백",
                    desc: "feedbackCount\n저장된 아웃핏에 대해 피드백을 남긴 횟수입니다.",
                },
            },
            {
                key: "rate",
                label: "피드백률",
                value: percentText(s.feedbackRate),
                sub: "피드백/저장 기반",
                icon: MessageSquareHeart,
                tone: DASHBOARD_THEME.kpi.rate,
                help: {
                    title: "피드백률",
                    desc: "feedbackRate = feedbackCount / monthlyOutfitCount × 100\n저장=0이면 '-'로 표시합니다.",
                },
            },
            {
                key: "model",
                label: "대표 추천 모델",
                value: strategyLabel(s.mostUsedRecoStrategy),
                sub: `날씨 ${s.mostCommonCondition ?? "-"}`,
                icon: Cpu,
                tone: DASHBOARD_THEME.kpi.model,
                help: {
                    title: "대표 추천 모델",
                    desc: "mostUsedRecoStrategy\n해당 월에 가장 많이 사용된 추천 전략(모델 타입)입니다.",
                },
            },
        ] as const;
    }, [ui, rangeText]);

    /** =========================
     * Funnel
     * ========================= */
    const funnelData = useMemo(() => {
        if (!ui) return [];
        return [
            { step: "저장", value: ui.funnel.saved },
            { step: "피드백", value: ui.funnel.feedback },
        ];
    }, [ui]);

    const funnelRate = useMemo(() => {
        if (!ui) return null;
        return safeRate(ui.funnel.feedback, ui.funnel.saved);
    }, [ui]);

    /** =========================
     * Donut
     * ========================= */
    const donutData = useMemo(() => (ui ? ui.donut.data ?? [] : []), [ui]);
    const donutEmpty = !ui || (ui.donut.totalClicks ?? 0) <= 0 || donutData.length === 0;

    const donutCenter = useMemo(() => {
        if (!donutData.length) return { title: "-", sub: "-" };
        const sorted = [...donutData].sort((a, b) => (b.ratioRaw ?? 0) - (a.ratioRaw ?? 0));
        const top = sorted[0];
        return { title: ratioToPercentText(top?.ratioRaw), sub: top?.name ?? "-" };
    }, [donutData]);

    const topClicked = ui?.topClickedItems ?? [];
    const topFavClicked = ui?.topFavoritedClickedItems ?? [];
    const monthOptions = useMemo(() => Array.from({ length: 12 }).map((_, i) => i + 1), []);

    const goPrevMonth = () => {
        if (month === 1) {
            setYear((y) => y - 1);
            setMonth(12);
        } else setMonth((m) => m - 1);
    };
    const goNextMonth = () => {
        if (month === 12) {
            setYear((y) => y + 1);
            setMonth(1);
        } else setMonth((m) => m + 1);
    };
    const goThisMonth = () => {
        const d = new Date();
        setYear(d.getFullYear());
        setMonth(d.getMonth() + 1);
    };

    return (
        <div className="space-y-8">
            {/* Header + Context */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">나의 스타일 통계</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">월별 저장/피드백/클릭 데이터를 요약합니다.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goPrevMonth} aria-label="prev-month">
                            <ChevronLeft size={16} />
                        </Button>

                        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 h-9">
                            <Calendar size={16} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-700">{yyyymm(year, month)} 리포트</span>
                            <span className="text-slate-200">|</span>
                            <select
                                className="text-sm font-black text-slate-600 bg-transparent outline-none"
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                            >
                                {monthOptions.map((m) => (
                                    <option key={m} value={m}>
                                        {pad2(m)}월
                                    </option>
                                ))}
                            </select>

                            <span className={`ml-2 inline-flex items-center px-2 h-6 rounded-full ${DASHBOARD_THEME.badge.orange}`}>
                {ui ? rangeText : "-"}
              </span>
                        </div>

                        <Button variant="outline" size="sm" onClick={goNextMonth} aria-label="next-month">
                            <ChevronRight size={16} />
                        </Button>

                        <Button variant="outline" size="sm" onClick={goThisMonth}>
                            이번달
                        </Button>

                    </div>
                </div>

                {error ? (
                    <div className={`rounded-2xl px-5 py-4 ${DASHBOARD_THEME.notice.error}`}>
                        <div className="text-sm font-black">대시보드 로드 실패</div>
                        <div className="mt-1 text-xs font-bold">{error}</div>
                    </div>
                ) : null}

                {/* Hero */}
                <div className="rounded-3xl border border-slate-100 bg-white px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 ring-4 ring-orange-100">
                            <Sparkles size={22} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base md:text-lg font-black text-slate-900 leading-7">{hero.title}</div>
                            <div className="mt-1 text-xs md:text-sm font-bold text-slate-500 leading-6">{hero.desc}</div>

                            <div className="mt-3 flex flex-wrap gap-2">

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading || !kpi ? (
                    <>
                        <Card className="p-6">
                            <SkeletonBlock className="h-12 w-12" />
                            <SkeletonBlock className="h-3 w-24 mt-4" />
                            <SkeletonBlock className="h-7 w-28 mt-2" />
                            <SkeletonBlock className="h-3 w-32 mt-3" />
                        </Card>
                        <Card className="p-6">
                            <SkeletonBlock className="h-12 w-12" />
                            <SkeletonBlock className="h-3 w-24 mt-4" />
                            <SkeletonBlock className="h-7 w-28 mt-2" />
                            <SkeletonBlock className="h-3 w-32 mt-3" />
                        </Card>
                        <Card className="p-6">
                            <SkeletonBlock className="h-12 w-12" />
                            <SkeletonBlock className="h-3 w-24 mt-4" />
                            <SkeletonBlock className="h-7 w-28 mt-2" />
                            <SkeletonBlock className="h-3 w-32 mt-3" />
                        </Card>
                        <Card className="p-6">
                            <SkeletonBlock className="h-12 w-12" />
                            <SkeletonBlock className="h-3 w-24 mt-4" />
                            <SkeletonBlock className="h-7 w-28 mt-2" />
                            <SkeletonBlock className="h-3 w-32 mt-3" />
                        </Card>
                    </>
                ) : (
                    kpi.map((x) => (
                        <Card key={x.key} className="p-6 border border-slate-100">
                            <div className="flex items-start justify-between">
                                <div
                                    className={[
                                        "w-12 h-12 rounded-2xl flex items-center justify-center ring-4",
                                        x.tone.bg,
                                        x.tone.fg,
                                        x.tone.ring,
                                    ].join(" ")}
                                >
                                    <x.icon size={22} />
                                </div>
                                <InfoTip help={x.help} />
                            </div>

                            <div className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{x.label}</div>
                            <div className="text-2xl font-black text-[#0F172A] mt-1">{x.value}</div>
                            <div className="text-xs font-bold text-slate-500 mt-2 leading-5">{x.sub}</div>
                        </Card>
                    ))
                )}
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-12 gap-8">
                {/* Funnel */}
                <div className="lg:col-span-8">
                    <Card title="이용 퍼널" subtitle="P0: 저장 → 피드백" className="border border-slate-100">
                        <div className="px-6 pb-6">
                            {loading || !ui ? (
                                <div className="py-6 space-y-3">
                                    <SkeletonBlock className="h-6 w-40" />
                                    <SkeletonBlock className="h-40 w-full" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between pt-4 pb-3">
                                        <div className="text-xs font-black text-slate-600 flex items-center gap-2">
                                            전환율:{" "}
                                            <span className="text-slate-900">{funnelRate === null ? "-" : `${Math.round(funnelRate)}%`}</span>
                                            <InfoTip help={{ title: "전환율", desc: "전환율 = 피드백 / 저장\n저장이 0이면 전환율은 '-' 처리합니다." }} />
                                        </div>
                                    </div>

                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={funnelData} margin={{ top: 10, right: 12, bottom: 10, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="step" tick={{ fontSize: 12, fontWeight: 800 }} />
                                                <YAxis allowDecimals={false} />
                                                <RechartsTooltip />
                                                <Bar dataKey="value" radius={[12, 12, 12, 12]} fill={DASHBOARD_THEME.brand.primary}>
                                                    <LabelList dataKey="value" position="top" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-bold ${DASHBOARD_THEME.notice.info} flex items-start gap-2`}>
                                        <Info size={14} className="mt-[2px] shrink-0 text-slate-400" />
                                        <span className="leading-5">
                      P0에서는 “추천 생성/선택” 단계 로그가 없어서 퍼널을 2단계로 제한합니다. (이벤트 로그 추가 시 확장)
                    </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Donut */}
                <div className="lg:col-span-4">
                    <Card title="선호 카테고리 분포" subtitle="도넛(클릭 기반)" className="h-full border border-slate-100">
                        <div className="px-6 pb-6">
                            <div className="pt-4 flex items-center justify-between">
                                <div className="text-xs font-black text-slate-600 flex items-center gap-2">
                                    기준:
                                    <span className={`inline-flex items-center px-3 h-7 rounded-full ${DASHBOARD_THEME.badge.orange}`}>
                    {ui ? basisLabel(ui.donut.basis) : "-"}
                  </span>
                                    <InfoTip
                                        help={{
                                            title: "기준(basis)",
                                            desc: "ALL_CLICKS: 전체 클릭 기준\nFAVORITED_CLICKS: 찜한 아이템 중 클릭 기준\n(현재는 서버 응답 기준값을 표시합니다.)",
                                        }}
                                    />
                                </div>

                                <div className="flex items-center gap-1 rounded-full border border-slate-100 bg-white p-1">
                                    {(["ALL_CLICKS", "FAVORITED_CLICKS"] as DonutBasis[]).map((b) => {
                                        const active = donutBasis === b;
                                        return (
                                            <button
                                                key={b}
                                                onClick={() => setDonutBasis(b)}
                                                className={[
                                                    "h-8 px-3 rounded-full text-xs font-black transition",
                                                    active ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50",
                                                ].join(" ")}
                                                type="button"
                                                title="(현재는 표시 토글입니다. 서버가 basis 파라미터를 지원하면 리패치로 연결하세요.)"
                                            >
                                                {b === "ALL_CLICKS" ? "전체" : "찜"}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={`mt-3 rounded-2xl px-4 py-3 text-xs font-bold ${DASHBOARD_THEME.notice.warn} flex items-start gap-2`}>
                                <MousePointerClick size={14} className="mt-[2px] shrink-0" />
                                <span className="leading-5">클릭 데이터는 누적 기반이라, DB가 비어있으면 차트가 비어 보일 수 있습니다.</span>
                            </div>

                            {loading || !ui ? (
                                <div className="py-6 space-y-4">
                                    <SkeletonBlock className="h-40 w-full" />
                                    <SkeletonBlock className="h-3 w-48" />
                                </div>
                            ) : donutEmpty ? (
                                <div className="mt-6">
                                    <EmptyState
                                        icon={<MousePointerClick size={18} />}
                                        title="아직 클릭 데이터가 없습니다"
                                        desc="추천 결과에서 아이템을 눌러주면 카테고리 분포가 쌓입니다."
                                    />
                                </div>
                            ) : (
                                <div className="mt-6 flex flex-col items-center gap-6">
                                    <div className="relative w-[220px] h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} paddingAngle={2}>
                                                    {donutData.map((_, idx) => (
                                                        <Cell key={idx} fill={DASHBOARD_THEME.donutColors[idx % DASHBOARD_THEME.donutColors.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                            <div className="text-2xl font-black text-[#0F172A]">{donutCenter.title}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{donutCenter.sub}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        {donutData.map((d, idx) => (
                                            <div key={d.category} className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ background: DASHBOARD_THEME.donutColors[idx % DASHBOARD_THEME.donutColors.length] }}
                                                />
                                                <div className="text-[11px] font-bold text-slate-800">
                                                    {d.name} <span className="text-slate-500 font-black">({ratioToPercentText(d.ratioRaw)})</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Top Lists */}
            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-6">
                    <Card title="가장 많이 클릭된 아이템" subtitle="Top Clicks" className="border border-slate-100">
                        <div className="px-6 pb-6 pt-4">
                            {loading || !ui ? (
                                <div className="space-y-3">
                                    <SkeletonBlock className="h-12 w-full" />
                                    <SkeletonBlock className="h-12 w-full" />
                                    <SkeletonBlock className="h-12 w-full" />
                                </div>
                            ) : topClicked.length === 0 ? (
                                <EmptyState icon={<MousePointerClick size={18} />} title="데이터 없음" desc="아이템 클릭이 쌓이면 Top 리스트가 표시됩니다." />
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {topClicked.slice(0, 5).map((it) => (
                                        <TopItemRow
                                            key={it.clothingId}
                                            name={it.name}
                                            category={categoryLabel(it.category)}
                                            count={it.count}
                                            imageUrl={it.imageUrl}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-6">
                    <Card title="찜한 아이템 중 클릭 Top" subtitle="Favorited Clicks" className="border border-slate-100">
                        <div className="px-6 pb-6 pt-4">
                            {loading || !ui ? (
                                <div className="space-y-3">
                                    <SkeletonBlock className="h-12 w-full" />
                                    <SkeletonBlock className="h-12 w-full" />
                                    <SkeletonBlock className="h-12 w-full" />
                                </div>
                            ) : topFavClicked.length === 0 ? (
                                <EmptyState icon={<MousePointerClick size={18} />} title="데이터 없음" desc="찜 + 클릭 데이터가 쌓이면 Top 리스트가 표시됩니다." />
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {topFavClicked.slice(0, 5).map((it) => (
                                        <TopItemRow
                                            key={it.clothingId}
                                            name={it.name}
                                            category={categoryLabel(it.category)}
                                            count={it.count}
                                            imageUrl={it.imageUrl}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Footer Notice */}
            <div className={`rounded-2xl px-5 py-4 flex items-start gap-3 ${DASHBOARD_THEME.notice.info}`}>
                <div className="w-10 h-10 rounded-2xl bg-white text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <Info size={18} />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-black text-slate-800">주의</div>
                    <div className="mt-1 text-xs font-bold text-slate-600 leading-5">
                        통계는 <b>세션키 기준</b>으로 집계됩니다. 데이터가 없으면 일부 차트/리스트는 비어 보일 수 있습니다.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;