// src/shared/ui/sections/WeatherHeroSection.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Snowfall from "react-snowfall";

import { Card } from "../components/Card";
import type { WeatherData } from "../types";
import { Wind, Droplets, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { clamp, fmtTempInt, fmtTempIntMin, fmtTempIntMax, fmtPercent, fmtWind, toNumber } from "@/shared/utils/format";

// ---------- sky normalize + icon ----------
function normalizeSky(sky: unknown): "CLEAR" | "CLOUDS" | "RAIN" | "SNOW" | "UNKNOWN" {
    const raw = typeof sky === "string" ? sky.trim() : "";
    const up = raw.toUpperCase();

    if (up.includes("CLEAR")) return "CLEAR";
    if (up.includes("CLOUD")) return "CLOUDS";
    if (up.includes("RAIN")) return "RAIN";
    if (up.includes("SNOW")) return "SNOW";
    return "UNKNOWN";
}

function skyIcon(sky: unknown): string {
    const key = normalizeSky(sky);
    switch (key) {
        case "CLEAR": return "☀️";
        case "CLOUDS": return "☁️";
        case "RAIN": return "🌧️";
        case "SNOW": return "❄️";
        default: return "—";
    }
}

// ---------- date helpers ----------
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

// ---------- weekly slot (5개 고정, fake temp 금지) ----------
type WeeklySlot = {
    date: string;
    dayLabel: string;
    icon: string;
    min?: unknown;
    max?: unknown;
    pop?: unknown;
    sky?: unknown;
};

function buildWeeklySlots5(weekly: any[] | undefined, fallbackDateISO: string): WeeklySlot[] {
    const base = Array.isArray(weekly) ? [...weekly] : [];
    base.sort((a, b) => String(a?.date ?? "").localeCompare(String(b?.date ?? "")));

    const out: WeeklySlot[] = [];
    for (let i = 0; i < 5; i++) {
        const src = base[i];
        const date = typeof src?.date === "string" && src.date ? src.date : addDaysISO(fallbackDateISO, i);

        const label =
            i === 0 ? "오늘" :
                i === 1 ? "내일" :
                    (typeof src?.dayLabel === "string" && src.dayLabel ? src.dayLabel : dayLabelKo(date));

        const icon =
            typeof src?.icon === "string" && src.icon && src.icon !== "—"
                ? src.icon
                : skyIcon(src?.sky);

        out.push({
            date,
            dayLabel: label,
            icon,
            min: src?.min,
            max: src?.max,
            pop: src?.pop,
            sky: src?.sky,
        });
    }
    return out;
}

// ---------- humidity donut ----------
function HumidityDonut({ value }: { value: unknown }) {
    const n = toNumber(value);
    const pct = n == null ? null : clamp(Math.round(n), 0, 100);

    return (
        <div className="mt-3 flex items-center gap-4">
            <div
                className="h-14 w-14 rounded-full p-[3px]"
                style={{
                    background:
                        pct == null
                            ? "conic-gradient(#e2e8f0 0deg, #e2e8f0 360deg)"
                            : `conic-gradient(#2563eb ${pct * 3.6}deg, #e2e8f0 0deg)`,
                }}
            >
                <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                    <div className="text-xs font-black text-slate-700 tabular-nums">
                        {pct == null ? "—" : `${pct}%`}
                    </div>
                </div>
            </div>

            <div className="min-w-0">
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {fmtPercent(value)}
                </div>
                <div className="mt-1 text-xs font-bold text-slate-500">
                    쾌적도에 직접 영향
                </div>
            </div>
        </div>
    );
}

export const WeatherHeroSection: React.FC<{ data: WeatherData }> = ({ data }) => {
    const fallbackDate = data.date ?? toISODate(new Date());
    const weekly5 = useMemo(() => buildWeeklySlots5((data as any).weekly, fallbackDate), [data, fallbackDate]);

    const skyKey = normalizeSky((data as any).sky);
    const isSnow = skyKey === "SNOW";

    const temp = (data as any).temp;
    const feelsLike = (data as any).feelsLike;
    const condition = (data as any).condition ?? "—";
    const humidity = (data as any).humidity;
    const windSpeed = (data as any).windSpeed;

    return (
        <Card
            className={[
                "relative overflow-hidden border border-slate-200/70",
                "bg-gradient-to-br from-white via-white to-orange-50/60",
                "shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]",
            ].join(" ")}
        >
            {/* 배경 이펙트 */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
                <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-orange-400 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-slate-900 blur-3xl" />
            </div>

            {/* 눈 내리기 (SNOW일 때만) */}
            {isSnow && (
                <div className="pointer-events-none absolute inset-0 z-[1]">
                    <Snowfall snowflakeCount={120} />
                </div>
            )}

            <div className="relative z-10">
                {/* TOP ROW */}
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                    {/* LEFT: 메인 온도 */}
                    <div className="flex-1">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                {/* 상단 온도: 정수 반올림 */}
                                <div className="text-7xl font-black tracking-tighter text-slate-900 tabular-nums leading-none">
                                    {fmtTempInt(temp)}
                                </div>

                                <div className="pt-1">
                                    <div className="text-xl font-black text-orange-600">{condition}</div>
                                    {/* 체감도 정수로 간단 */}
                                    <div className="text-sm text-slate-500 font-semibold">
                                        체감 {fmtTempInt(feelsLike)}
                                    </div>
                                </div>
                            </div>

                            {/* 시그널 칩 */}
                            {Array.isArray((data as any).signals) && (data as any).signals.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {(data as any).signals.map((s: string, i: number) => (
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

                    {/* RIGHT: 습도/풍속 + CTA(가로) */}
                    <div className="w-full lg:w-[560px]">
                        <div className="grid grid-cols-2 gap-4">
                            {/* 습도 카드 (차트) */}
                            <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Droplets className="text-blue-500" size={20} />
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">습도</div>
                                </div>
                                <HumidityDonut value={humidity} />
                            </div>

                            {/* 풍속 카드 */}
                            <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Wind className="text-slate-700" size={20} />
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">풍속</div>
                                </div>
                                <div className="mt-3 text-2xl font-black text-slate-900 tabular-nums">
                                    {fmtWind(windSpeed)}
                                </div>
                                <div className="mt-2 text-xs font-bold text-slate-500">체감 온도 변동</div>
                            </div>

                            {/* CTA 가로 확장 (오늘 요약 삭제하고 합침) */}
                            <Link to="/checklist" className="col-span-2 block">
                                <div
                                    className={[
                                        "h-[112px] rounded-3xl px-7",
                                        "bg-orange-500 text-white",
                                        "shadow-[0_18px_40px_-20px_rgba(249,115,22,0.65)]",
                                        "border border-orange-400/30",
                                        "transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-25px_rgba(249,115,22,0.75)]",
                                        "flex items-center justify-between",
                                        "group",
                                    ].join(" ")}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                                            <Sparkles className="text-white" size={22} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/80">
                                                추천 시작
                                            </div>
                                            <div className="mt-1 text-2xl font-black">
                                                오늘의 옷 추천 받기
                                            </div>
                                            <div className="mt-1 text-xs font-bold text-white/80">
                                                체크리스트로 이동
                                            </div>
                                        </div>
                                    </div>

                                    <ArrowRight className="text-white/70 group-hover:text-white transition" size={20} />
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* BOTTOM: 이번 주 날씨 (아래로 내림 + 여백 고정) */}
                <div className="mt-10 rounded-3xl border border-slate-200/70 bg-white/75 backdrop-blur px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-black text-slate-900">이번 주 날씨</div>
                            <div className="text-xs font-bold text-slate-500 mt-1">5일 흐름을 보고 옷 선택 실수 줄이기</div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full">
                            Weekly
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-5 gap-4">
                        {weekly5.map((item, idx) => (
                            <div
                                key={`${item.date}-${idx}`}
                                className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 text-center flex flex-col items-center"
                            >
                                <div className="h-4 text-[11px] font-black text-slate-700">{item.dayLabel ?? "—"}</div>

                                <div className="mt-3 h-9 flex items-center justify-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/70">
                    {item.icon ?? "—"}
                  </span>
                                </div>

                                {/* 최고(빨강) / 최저(파랑) */}
                                <div className="mt-3 h-5 text-[12px] font-black tabular-nums flex items-center justify-center gap-2">
                                    <span className="text-red-500">{fmtTempIntMax(item.max)}</span>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-blue-600">{fmtTempIntMin(item.min)}</span>
                                </div>

                                <div className="mt-2 h-4 text-[10px] font-bold text-slate-500">
                                    {item.pop == null ? "" : `강수 ${fmtPercent(item.pop)}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};