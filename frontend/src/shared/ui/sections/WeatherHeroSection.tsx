import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import type { WeatherData, WeeklyForecastItem } from "../types";
import { Wind, Droplets, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const addDaysISO = (iso: string, days: number) => {
    const base = new Date(`${iso}T00:00:00`);
    base.setDate(base.getDate() + days);
    return toISODate(base);
};

const dayLabelKo = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    const map = ["일", "월", "화", "수", "목", "금", "토"];
    return map[d.getDay()];
};

const safeNum = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;

const safePop = (v: unknown) => {
    const n = safeNum(v);
    if (n === null) return null;
    // 백이 0~1로 줄 가능성도 방어(0.18 -> 18)
    if (n > 0 && n <= 1) return Math.round(n * 100);
    return Math.round(n);
};

const ensure7Weekly = (
    weekly: WeeklyForecastItem[] | undefined,
    fallbackDateISO: string
) => {
    const base = Array.isArray(weekly) ? [...weekly] : [];

    if (base.length === 0) {
        return new Array(7).fill(null).map((_, i) => {
            const date = addDaysISO(fallbackDateISO, i);
            return {
                date,
                dayLabel: i === 0 ? "오늘" : i === 1 ? "내일" : dayLabelKo(date),
                icon: "—",
                min: 0,
                max: 0,
                pop: 0,
                sky: "CLOUDS",
            } as WeeklyForecastItem;
        });
    }

    base.sort((a, b) => String(a.date).localeCompare(String(b.date)));

    if (base.length >= 7) {
        const sliced = base.slice(0, 7);
        if (sliced[0]) sliced[0] = { ...sliced[0], dayLabel: "오늘" };
        if (sliced[1]) sliced[1] = { ...sliced[1], dayLabel: "내일" };
        return sliced;
    }

    const last = base[base.length - 1];
    const lastDate =
        typeof last?.date === "string" && last.date ? last.date : fallbackDateISO;

    const filled: WeeklyForecastItem[] = [...base];

    for (let i = base.length; i < 7; i++) {
        const date = addDaysISO(lastDate, i - (base.length - 1));
        filled.push({
            ...last,
            date,
            dayLabel: dayLabelKo(date),
        });
    }

    if (filled[0]) filled[0] = { ...filled[0], dayLabel: "오늘" };
    if (filled[1]) filled[1] = { ...filled[1], dayLabel: "내일" };

    return filled;
};

export const WeatherHeroSection: React.FC<{ data: WeatherData }> = ({ data }) => {
    const weekly = useMemo(
        () => ensure7Weekly(data.weekly, data.date ?? toISODate(new Date())),
        [data.weekly, data.date]
    );

    // ✅ 실제 데이터만 사용 (UI에서 더미 생성 금지)
    const humidity = safeNum(data.humidity);
    const windSpeed = safeNum(data.windSpeed);

    const feelsLike = safeNum((data as any).feelsLike);
    const pop = safePop((data as any).precipitationProbability);

    const minTemp = safeNum((data as any).minTemp);
    const maxTemp = safeNum((data as any).maxTemp);

    return (
        <Card
            className={[
                "relative overflow-hidden border border-slate-200/70",
                "bg-gradient-to-br from-white via-white to-orange-50/60",
                "shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]",
            ].join(" ")}
        >
            {/* 얇은 패턴 */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
                <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-orange-400 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-slate-900 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10">
                {/* LEFT */}
                <div className="flex-1 space-y-7">
                    {/* 상단 요약 */}
                    <div className="flex items-start justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-start gap-4">
                                <div className="text-7xl font-black tracking-tighter text-slate-900">
                                    {safeNum(data.temp) ?? "—"}°
                                </div>
                                <div className="pt-2">
                                    <div className="text-xl font-black text-orange-600">
                                        {data.condition ?? "—"}
                                    </div>
                                    <div className="text-sm text-slate-500 font-semibold">
                                        체감 {safeNum(data.feelsLike) ?? "—"}°
                                    </div>
                                </div>
                            </div>

                            {/* ✅ “큰 일교차 주의” 같은 대문장(Description) 블록 제거 */}
                            {/* <p className="text-[15px] font-bold text-slate-700 ...">{data.description}</p> */}

                            {/* 시그널(칩)만 유지: 필요 없으면 이 블록도 통째로 삭제 */}
                            {Array.isArray(data.signals) && data.signals.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {data.signals.map((s, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full text-xs font-black text-slate-700 border border-slate-200/70"
                                        >
                                            <AlertCircle size={14} className="text-orange-500" />
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 주간 예보 */}
                    <div className="rounded-3xl border border-slate-200/70 bg-white/75 backdrop-blur px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-black text-slate-900">이번 주 날씨</div>
                                <div className="text-xs font-bold text-slate-500 mt-1">
                                    일주일 흐름을 보고 옷 선택 실수 줄이기
                                </div>
                            </div>

                            <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full">
                                Weekly
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-7 gap-2">
                            {weekly.map((item, idx) => (
                                <div
                                    key={`${item.date}-${idx}`}
                                    className="rounded-2xl border border-slate-200/70 bg-white px-3 py-3 text-center"
                                >
                                    <div className="text-[11px] font-black text-slate-700">
                                        {item.dayLabel ?? "-"}
                                    </div>

                                    <div className="mt-2 text-lg leading-none">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70">
                      {item.icon ?? "—"}
                    </span>
                                    </div>

                                    <div className="mt-2 text-[11px] font-black text-slate-900">
                                        {safeNum(item.max) !== null ? `${Math.round(item.max)}°` : "—"}
                                        <span className="text-slate-400 font-black"> / </span>
                                        <span className="text-slate-500">
                      {safeNum(item.min) !== null ? `${Math.round(item.min)}°` : "—"}
                    </span>
                                    </div>

                                    <div className="mt-1 text-[10px] font-bold text-slate-500">
                                        {safePop(item.pop) !== null ? `강수 ${safePop(item.pop)}%` : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: 타일 2x2 */}
                <div className="w-full lg:w-[380px]">
                    <div className="grid grid-cols-2 gap-4 auto-rows-fr items-stretch">
                        {/* 습도 */}
                        <div className="aspect-square rounded-3xl bg-white border border-slate-200/70 p-5 shadow-sm">
                            <Droplets className="mb-3 text-blue-500" size={20} />
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                습도
                            </div>
                            <div className="mt-1 text-2xl font-black text-slate-900">
                                {humidity ?? "—"}{humidity !== null ? "%" : ""}
                            </div>
                            <div className="mt-2 text-xs font-bold text-slate-500">
                                쾌적도에 직접 영향
                            </div>
                        </div>

                        {/* 풍속 */}
                        <div className="aspect-square rounded-3xl bg-white border border-slate-200/70 p-5 shadow-sm">
                            <Wind className="mb-3 text-slate-700" size={20} />
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                풍속
                            </div>
                            <div className="mt-1 text-2xl font-black text-slate-900">
                                {windSpeed ?? "—"}{windSpeed !== null ? "m/s" : ""}
                            </div>
                            <div className="mt-2 text-xs font-bold text-slate-500">
                                체감 온도 변동
                            </div>
                        </div>

                        {/* CTA */}
                        <Link to="/checklist" className="block">
                            <div
                                className={[
                                    "aspect-square rounded-3xl p-5",
                                    "bg-orange-500 text-white",
                                    "shadow-[0_18px_40px_-20px_rgba(249,115,22,0.65)]",
                                    "border border-orange-400/30",
                                    "transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-25px_rgba(249,115,22,0.75)]",
                                    "group",
                                ].join(" ")}
                            >
                                <div className="flex items-center justify-between">
                                    <Sparkles className="text-white" size={20} />
                                    <ArrowRight className="text-white/70 group-hover:text-white transition" size={18} />
                                </div>

                                <div className="mt-5">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/80">
                                        추천 시작
                                    </div>
                                    <div className="mt-2 text-2xl font-black leading-snug">
                                        오늘의
                                        <br />
                                        옷 추천
                                    </div>
                                    <div className="mt-2 text-xs font-bold text-white/80">
                                        체크리스트로 이동
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* 오늘 요약 */}
                        <div className="aspect-square rounded-3xl bg-slate-50 border border-slate-200/70 p-5 shadow-sm overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-black text-slate-900">오늘 요약</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">TODAY</div>
                            </div>

                            {/* ✅ 셀 박스 제거: border/bg/rounded 없음 */}
                            <div className="mt-4 flex-1 grid grid-cols-2 gap-3">
                                {[
                                    { label: "체감", value: typeof feelsLike === "number" ? feelsLike : null, unit: "°C", v: "text-slate-900", u: "text-slate-400" },
                                    { label: "강수", value: typeof pop === "number" ? pop : null, unit: "%", v: "text-slate-900", u: "text-slate-400" },
                                    { label: "최저", value: typeof minTemp === "number" ? minTemp : null, unit: "°C", v: "text-blue-600", u: "text-blue-400" },
                                    { label: "최고", value: typeof maxTemp === "number" ? maxTemp : null, unit: "°C", v: "text-red-500", u: "text-red-400" },
                                ].map((m) => (
                                    <div key={m.label} className="flex flex-col items-center justify-center text-center">
                                        <div className="text-[10px] font-black text-slate-500">{m.label}</div>

                                        <div className="mt-1 flex items-end gap-1">
                                            <div className={["text-3xl font-black leading-none tabular-nums", m.v].join(" ")}>
                                                {m.value ?? "—"}
                                            </div>
                                            {m.value !== null && (
                                                <div className={["text-[10px] font-black leading-none pb-[3px]", m.u].join(" ")}>
                                                    {m.unit}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};