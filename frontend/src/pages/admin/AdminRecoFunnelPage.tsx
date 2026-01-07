// src/pages/admin/AdminRecoFunnelPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Button, Badge, cn } from "@/app/DesignSystem";
import { adminDashboardApi } from "@/lib/api/adminDashboardApi";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LabelList,
} from "recharts";

type OverviewResponse = any; // 프로젝트에서 타입 있으면 교체

function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function clampTopN(n: number) {
    if (!Number.isFinite(n)) return 10;
    return Math.max(1, Math.min(50, Math.floor(n)));
}

function formatNumber(n: number) {
    return new Intl.NumberFormat("ko-KR").format(n ?? 0);
}

function formatPct(n: number) {
    if (n == null || Number.isNaN(n)) return "-";
    return `${n.toFixed(2)}%`;
}

function calcDrop(prev: number, next: number) {
    const drop = Math.max(0, (prev ?? 0) - (next ?? 0));
    const dropRate = prev > 0 ? (drop / prev) * 100 : 0;
    return { drop, dropRate };
}

const FunnelTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-sm font-bold text-slate-800">{d.stageLabel}</div>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between gap-6">
                    <span>잔존</span>
                    <span className="font-semibold text-slate-900">{formatNumber(d.remain)}</span>
                </div>
                <div className="flex justify-between gap-6">
                    <span>이탈</span>
                    <span className="font-semibold text-slate-900">
            {formatNumber(d.drop)} ({formatPct(d.dropRate)})
          </span>
                </div>
            </div>
        </div>
    );
};

export default function AdminRecoFunnelPage() {
    const [sp, setSp] = useSearchParams();

    const defaultFrom = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return toISODate(d);
    }, []);
    const defaultTo = useMemo(() => toISODate(new Date()), []);

    const from = sp.get("from") ?? defaultFrom;
    const to = sp.get("to") ?? defaultTo;

    // ✅ TopN: 필터에서 제거. 내부 고정값만 사용(퍼널에는 영향 없음)
    const topN = 10;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<OverviewResponse | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminDashboardApi.getOverview({
                from,
                to,
                topN: clampTopN(topN),
            });
            setData(res);
        } catch (e: any) {
            setError(e?.message ?? "조회 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to]);

    const summary = data?.metrics?.summary;
    const funnel = summary?.funnel;

    const checklistSubmitted = Number(funnel?.checklistSubmitted ?? 0);
    const recoShown = Number(funnel?.recoShown ?? 0);
    const itemSelected = Number(funnel?.itemSelected ?? 0);

    const drop1 = calcDrop(checklistSubmitted, recoShown);
    const drop2 = calcDrop(recoShown, itemSelected);

    const chartData = useMemo(() => {
        const s1 = { stage: "CHECKLIST", stageLabel: "체크리스트 제출", prev: checklistSubmitted, remain: checklistSubmitted, drop: 0, dropRate: 0 };
        const s2 = { stage: "SHOWN", stageLabel: "추천 노출", prev: checklistSubmitted, remain: recoShown, drop: drop1.drop, dropRate: drop1.dropRate };
        const s3 = { stage: "SELECT", stageLabel: "아이템 선택", prev: recoShown, remain: itemSelected, drop: drop2.drop, dropRate: drop2.dropRate };
        return [s1, s2, s3];
    }, [checklistSubmitted, recoShown, itemSelected, drop1.drop, drop1.dropRate, drop2.drop, drop2.dropRate]);

    const kpi = useMemo(() => {
        const checklistToShownRate = Number(funnel?.checklistToShownRate ?? 0);
        const shownToSelectRate = Number(funnel?.shownToSelectRate ?? 0);
        const d1 = Number(data?.metrics?.d1RetentionSummary?.d1RetentionRate ?? 0);
        const emptyRate = Number(summary?.recoEmptyRate ?? 0);
        return { checklistToShownRate, shownToSelectRate, d1, emptyRate };
    }, [data, funnel, summary]);

    const diagnosis = useMemo(() => {
        // 드롭오프 우선순위
        const primary = drop1.dropRate >= drop2.dropRate
            ? { title: "Drop-off 최우선 구간", label: "체크리스트 → 추천 노출", rate: drop1.dropRate }
            : { title: "Drop-off 최우선 구간", label: "추천 노출 → 아이템 선택", rate: drop2.dropRate };

        const hints = [
            {
                title: "추천 Empty Rate",
                value: formatPct(Number(summary?.recoEmptyRate ?? 0)),
                desc: "Empty가 높으면 인벤토리/필터/모델 입력 조건을 먼저 점검.",
            },
            {
                title: "오류율(대략)",
                value: formatPct(calcErrorRate(summary?.errorEvents, summary?.totalSessionEvents)),
                desc: "에러 이벤트 비중이 높으면 서버/클라이언트 로그부터 확인.",
            },
            {
                title: "재방문율",
                value: formatPct(Number(summary?.returningRate ?? 0)),
                desc: "재방문이 낮으면 ‘추천 품질’ 또는 ‘UX 동기’가 약함.",
            },
        ];

        return { primary, hints };
    }, [drop1.dropRate, drop2.dropRate, summary]);

    function calcErrorRate(errorEvents?: number, totalEvents?: number) {
        const e = Number(errorEvents ?? 0);
        const t = Number(totalEvents ?? 0);
        if (t <= 0) return 0;
        return (e / t) * 100;
    }

    const onApply = (nextFrom: string, nextTo: string) => {
        setSp({ from: nextFrom, to: nextTo }); // ✅ URL params 고정 정책
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-xl font-black text-slate-900">전환 퍼널</div>
                    <div className="mt-1 text-sm text-slate-500">
                        숫자 나열이 아니라 “어디서 이탈하는지”를 도형으로 확인합니다.
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="slate">/ADMIN/FUNNEL</Badge>
                    <Badge variant="orange">V1.1</Badge>
                </div>
            </div>

            <FilterRange from={from} to={to} loading={loading} onApply={onApply} onRefresh={refresh} />

            {error ? (
                <Card className="p-10 border-2 border-slate-100 text-center">
                    <div className="text-xl font-black text-slate-900">데이터 조회 실패</div>
                    <div className="mt-2 text-sm text-slate-500">{error}</div>
                    <div className="mt-6 flex justify-center gap-2">
                        <Button className="h-11 px-6" onClick={refresh}>다시 시도</Button>
                    </div>
                </Card>
            ) : (
                <>
                    {/* KPI (퍼널 페이지는 "핵심율"만) */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <KpiCard title="체크리스트 → 추천 노출" value={formatPct(kpi.checklistToShownRate)} emphasis />
                        <KpiCard title="추천 노출 → 선택" value={formatPct(kpi.shownToSelectRate)} emphasis />
                        <KpiCard title="리텐션(D1)" value={formatPct(kpi.d1)} />
                        <KpiCard title="추천 Empty Rate" value={formatPct(kpi.emptyRate)} />
                    </div>

                    {/* 메인: 워터폴 + 진단 */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Card className="p-6 lg:col-span-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-base font-black text-slate-900">퍼널 워터폴</div>
                                    <div className="mt-1 text-sm text-slate-500">
                                        잔존(주황) / 이탈(회색)을 한 번에 봅니다.
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400">{from} ~ {to}</div>
                            </div>

                            <div className="mt-6 h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barCategoryGap={24} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="stageLabel" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip content={<FunnelTooltip />} />

                                        {/* ✅ 잔존(주황) */}
                                        <Bar dataKey="remain" name="잔존" radius={[10, 10, 10, 10]} fill="var(--accent-orange, #F97316)">
                                            <LabelList
                                                dataKey="remain"
                                                position="top"
                                                formatter={(v: any) => formatNumber(Number(v ?? 0))}
                                                className="fill-slate-700"
                                            />
                                        </Bar>

                                        {/* ✅ 이탈(회색): stage2, stage3만 의미가 있음 */}
                                        <Bar dataKey="drop" name="이탈" radius={[10, 10, 10, 10]} fill="#CBD5E1">
                                            <LabelList
                                                dataKey="dropRate"
                                                position="top"
                                                formatter={(v: any) => (Number(v ?? 0) > 0 ? `-${formatPct(Number(v))}` : "")}
                                                className="fill-slate-500"
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <MiniStat label="체크리스트 제출" value={formatNumber(checklistSubmitted)} />
                                <MiniStat label="추천 노출" value={formatNumber(recoShown)} />
                                <MiniStat label="아이템 선택" value={formatNumber(itemSelected)} />
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="text-base font-black text-slate-900">진단</div>
                            <div className="mt-1 text-sm text-slate-500">
                                가장 큰 이탈 구간부터 우선순위를 잡습니다.
                            </div>

                            <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                                <div className="text-xs font-semibold text-orange-700">{diagnosis.primary.title}</div>
                                <div className="mt-1 text-sm font-black text-slate-900">{diagnosis.primary.label}</div>
                                <div className="mt-2 text-2xl font-black text-orange-600">{formatPct(diagnosis.primary.rate)}</div>
                                <div className="mt-2 text-xs text-slate-600">
                                    이 구간의 UX/데이터 품질(Empty/에러)을 먼저 확인하세요.
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {diagnosis.hints.map((h) => (
                                    <div key={h.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold text-slate-900">{h.title}</div>
                                            <div className="text-sm font-black text-slate-900">{h.value}</div>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-500">{h.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

function KpiCard({ title, value, emphasis }: { title: string; value: string; emphasis?: boolean }) {
    return (
        <Card className={cn("p-5", emphasis && "border-orange-200")}>
            <div className="text-xs font-semibold text-slate-500">{title}</div>
            <div className={cn("mt-2 text-2xl font-black", emphasis ? "text-orange-600" : "text-slate-900")}>{value}</div>
            <div className="mt-2 text-xs text-slate-400">서버 계산값 그대로 표기</div>
        </Card>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-500">{label}</div>
            <div className="mt-2 text-lg font-black text-slate-900">{value}</div>
        </div>
    );
}

function FilterRange({
                         from,
                         to,
                         loading,
                         onApply,
                         onRefresh,
                     }: {
    from: string;
    to: string;
    loading: boolean;
    onApply: (from: string, to: string) => void;
    onRefresh: () => void;
}) {
    const [localFrom, setLocalFrom] = useState(from);
    const [localTo, setLocalTo] = useState(to);

    useEffect(() => setLocalFrom(from), [from]);
    useEffect(() => setLocalTo(to), [to]);

    return (
        <Card className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <div className="text-xs font-bold text-slate-400">FROM</div>
                        <input
                            type="date"
                            value={localFrom}
                            onChange={(e) => setLocalFrom(e.target.value)}
                            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
                        />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400">TO</div>
                        <input
                            type="date"
                            value={localTo}
                            onChange={(e) => setLocalTo(e.target.value)}
                            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button className="h-12 px-6" disabled={loading} onClick={() => onApply(localFrom, localTo)}>
                        적용
                    </Button>
                    <Button variant="outline" className="h-12 px-6" disabled={loading} onClick={onRefresh}>
                        새로고침
                    </Button>
                </div>
            </div>

            {/* ✅ TopN 입력 제거: 퍼널 페이지 필터에는 존재하면 안 됨 */}
            <div className="mt-3 text-xs text-slate-400">
                기간(from/to)만 변경합니다. (TopN은 리포트 옵션이라 표/카드 내부에서만 노출)
            </div>
        </Card>
    );
}