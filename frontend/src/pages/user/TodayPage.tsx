// src/pages/user/TodayPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { SectionHeader, Card, Button, cn } from "../../app/DesignSystem";
import { WeatherHeroSection } from "../../shared/ui/sections/WeatherHeroSection";
import {
    MapPin,
    RefreshCw,
    Sparkles,
    CheckCircle2,
    History as HistoryIcon,
    ThermometerSun,
    Activity,
    Info,
    Shirt,
    Layers,
    Wind,
} from "lucide-react";

import { useWeather } from "@/lib/hooks/useWeather";
import { normalizeWeeklyTo7 } from "@/shared/domain/weather";
import type { RootState } from "@/app/store";
import { getUserMessage } from "@/lib/errors";
import { useAiService } from "@/lib/hooks/useAiService";
import { Tooltip } from "@/shared/ui/components/Tooltip";

import {
    selectLastSavedTodayOutfit,
    selectSelectedOutfitSnapshot,
    selectRecoModelKey,
    selectRecentHistory,
} from "@/state/outfitReco/outfitRecoSlice";
import { useAppSelector } from "@/state/hooks/hooks";

import { closetApi, type ClothesSummaryItemDto } from "@/lib/api/closetApi";
import { outfitRepo } from "@/lib/repo/outfitRepo";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";
import { buildTodayPreviewVM, type TodayWeatherMiniDto } from "@/lib/adapters/todayPreviewAdapter";

/**
 * =========================
 * Endpoints (요청대로 RECENT_HISTORY_ENDPOINT 건드리지 않음)
 * =========================
 */
const TODAY_RECO_ENDPOINT = "/api/recommend/today/by-category";
const RECENT_HISTORY_ENDPOINT = "/api/outfits/today"; // ✅ 유지(요청사항)

/**
 * ✅ 임시 고정 세션키
 */
const TEMP_SESSION_KEY = "f817a912-162f-474e-abe2-52dc5236c1a2";

/**
 * 날씨 “요약” API (실제 경로 맞추기)
 */
const TODAY_WEATHER_ENDPOINT = "/api/weather/today";

/**
 * =========================
 * Types
 * =========================
 */
type Category = "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";

type RecommendedItemDto = {
    id: number;
    clothingId: number;
    name: string;
    category: Category;
    imageUrl?: string | null;
    brand?: string | null;
    favorited?: boolean;
};

type ApiResponse<T> = {
    success: boolean;
    code: string;
    message: string;
    data: T;
};

type OutfitHistoryDto = {
    id: string | number;
    outfitDate?: string; // YYYY-MM-DD
    title?: string | null;
    thumbnailUrl?: string | null;
    feedbackScore?: number | null; // ✅ (있을 때만 사용)
    items?: Array<{
        category?: Category;
        clothingId?: number;
        name?: string;
        imageUrl?: string | null;
        sortOrder?: number;
    }>;
};

const SkeletonBlock = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />
);

function isFiniteNumber(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v);
}

function pick3<T>(arr: T[]) {
    return arr.slice(0, 3);
}

function byCategory(items: RecommendedItemDto[]) {
    const top = items.filter((x) => x.category === "TOP");
    const bottom = items.filter((x) => x.category === "BOTTOM");
    const outer = items.filter((x) => x.category === "OUTER");
    return { top, bottom, outer };
}

function formatDateKR(iso?: string) {
    if (!iso) return "-";
    const y = iso.slice(0, 4);
    const m = iso.slice(5, 7);
    const d = iso.slice(8, 10);
    return `${y}.${m}.${d}`;
}

function categoryKr(c: Category) {
    if (c === "TOP") return "상의";
    if (c === "BOTTOM") return "하의";
    if (c === "OUTER") return "아우터";
    return "원피스";
}

function toISO(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * =========================
 * Modal: Today 3x3 By Category
 * =========================
 */
function TodayRecoByCategoryModal({
                                      open,
                                      onClose,
                                      loading,
                                      error,
                                      data,
                                  }: {
    open: boolean;
    onClose: () => void;
    loading: boolean;
    error: string | null;
    data: { top: RecommendedItemDto[]; bottom: RecommendedItemDto[]; outer: RecommendedItemDto[] } | null;
}) {
    if (!open) return null;

    const col = [
        { key: "top", title: "상의", icon: <Shirt size={16} className="text-slate-500" /> },
        { key: "bottom", title: "하의", icon: <Layers size={16} className="text-slate-500" /> },
        { key: "outer", title: "아우터", icon: <Wind size={16} className="text-slate-500" /> },
    ] as const;

    const getItems = (k: (typeof col)[number]["key"]) => {
        if (!data) return [];
        return pick3(data[k]);
    };

    const Placeholder = ({ label }: { label: string }) => (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-black text-slate-600">{label}</div>
            <div className="mt-1 text-[11px] font-bold text-slate-500 leading-5">
                아직 추천할 아이템이 부족합니다.
                <br />
                옷장 등록을 먼저 해주세요.
            </div>
        </div>
    );

    const ItemCard = ({ it }: { it: RecommendedItemDto }) => (
        <div className="rounded-2xl border border-slate-100 bg-white p-3 hover:border-slate-200 transition">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300">
                            NO IMG
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-800 truncate">{it.name}</div>
                    <div className="mt-0.5 text-[10px] font-bold text-slate-400 truncate">
                        {it.brand ? it.brand : categoryKr(it.category)}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[9999]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <div className="text-base font-black text-slate-900">전체 코디 리스트</div>
                            <div className="text-xs font-bold text-slate-500 mt-1">날씨 기반 추천 (카테고리별 3개)</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={onClose}>
                            닫기
                        </Button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-3">
                                        <SkeletonBlock className="h-6 w-24" />
                                        <SkeletonBlock className="h-16 w-full" />
                                        <SkeletonBlock className="h-16 w-full" />
                                        <SkeletonBlock className="h-16 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
                                <div className="text-sm font-black">추천 리스트 로드 실패</div>
                                <div className="text-xs font-bold mt-1">{error}</div>
                            </div>
                        ) : !data ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                                <div className="text-sm font-black text-slate-700">추천 데이터가 없습니다</div>
                                <div className="text-xs font-bold text-slate-500 mt-1">API 응답을 확인하세요.</div>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {col.map((c) => {
                                    const items = getItems(c.key);
                                    return (
                                        <div key={c.key} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                {c.icon}
                                                <div className="text-sm font-black text-slate-800">{c.title}</div>
                                                <span className="text-[10px] font-black text-slate-400">({items.length}/3)</span>
                                            </div>

                                            {items.length === 0 ? (
                                                <Placeholder label={`${c.title} 없음`} />
                                            ) : (
                                                <div className="space-y-3">
                                                    {items.map((it) => (
                                                        <ItemCard key={it.clothingId} it={it} />
                                                    ))}
                                                    {items.length < 3
                                                        ? Array.from({ length: 3 - items.length }).map((_, idx) => (
                                                            <div
                                                                key={`pad-${c.key}-${idx}`}
                                                                className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-3"
                                                            >
                                                                <div className="text-[11px] font-bold text-slate-400">빈 슬롯</div>
                                                            </div>
                                                        ))
                                                        : null}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="text-[11px] font-bold text-slate-500">추천 결과는 데이터가 쌓일수록 안정화됩니다.</div>
                        <Button variant="primary" size="sm" onClick={onClose}>
                            확인
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * =========================
 * ✅ Preview UI (요청 레이아웃)
 * - 1번 레이아웃 + 2번 정보(dateLine/slotLine)
 * - 가운데 정렬 + 이모지 크게
 * - OUTER 미선택은 "비활성"처럼
 * =========================
 */
function parseSlots(slotLine: string) {
    // "👕 ...  |  👖 ...  |  🧥 ..."
    const parts = slotLine.split("|").map((s) => s.trim());
    const safe = (i: number) => parts[i] ?? "";

    const parse = (s: string) => {
        const icon = s.slice(0, 2).trim(); // emoji 1~2 codepoint 대응(실전에서 충분)
        const label = s.replace(icon, "").trim();
        const isMissing = label.includes("미선택");
        return { icon, label, isMissing };
    };

    return [
        { title: "상의", ...parse(safe(0)) },
        { title: "하의", ...parse(safe(1)) },
        { title: "아우터", ...parse(safe(2)) },
    ];
}

/**
 * =========================
 * TodayPage
 * =========================
 */
const TodayPage: React.FC = () => {
    const navigate = useNavigate();

    const lastSavedTodayOutfit = useAppSelector(selectLastSavedTodayOutfit);
    const selectedOutfitSnapshot = useAppSelector(selectSelectedOutfitSnapshot);
    const recoModelKey = useAppSelector(selectRecoModelKey);

    const reduxRecentHistory = useAppSelector(selectRecentHistory); // ✅ 서버 실패 fallback + 전날 피드백 탐색용

    const region = "Seoul";

    const sessionKeyFromStore = useSelector(
        (s: RootState) => ((s as any).session?.sessionKey ?? (s as any).session?.key) as string | undefined
    );
    const effectiveSessionKey = sessionKeyFromStore ?? TEMP_SESSION_KEY;

    const displayName = useMemo(() => {
        return effectiveSessionKey === TEMP_SESSION_KEY ? "코디온" : "Guest";
    }, [effectiveSessionKey]);

    // ---------------------------
    // Weather (메인 위젯)
    // ---------------------------
    const { data: weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } = useWeather(region);

    const weatherVm = useMemo(() => {
        if (!weather) return null;
        const weekly7 = normalizeWeeklyTo7(weather);
        const uvIndex = (weather as any).uvIndex ?? (weather as any).uvi ?? null;
        return { ...(weather as any), uvIndex, weekly: weekly7 };
    }, [weather]);

    // ---------------------------
    // AI comment
    // ---------------------------
    const { fetchDailyComment } = useAiService();
    const [aiComment, setAiComment] = useState<string | null>(null);

    useEffect(() => {
        const defaultLat = 37.5665;
        const defaultLon = 126.978;

        if (!navigator.geolocation) {
            fetchDailyComment(defaultLat, defaultLon).then(setAiComment);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchDailyComment(latitude, longitude).then(setAiComment);
            },
            () => {
                fetchDailyComment(defaultLat, defaultLon).then(setAiComment);
            }
        );
    }, [fetchDailyComment]);

    // ---------------------------
    // Recommendation modal
    // ---------------------------
    const [openReco, setOpenReco] = useState(false);
    const [recoLoading, setRecoLoading] = useState(false);
    const [recoError, setRecoError] = useState<string | null>(null);
    const [recoData, setRecoData] = useState<{ top: RecommendedItemDto[]; bottom: RecommendedItemDto[]; outer: RecommendedItemDto[] } | null>(
        null
    );

    const fetchTodayReco = useCallback(async () => {
        setRecoLoading(true);
        setRecoError(null);

        try {
            const headers: Record<string, string> = { Accept: "application/json" };
            if (effectiveSessionKey && effectiveSessionKey.trim().length > 0) headers["X-Session-Key"] = effectiveSessionKey;

            const res = await fetch(TODAY_RECO_ENDPOINT, { method: "GET", headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = (await res.json()) as ApiResponse<RecommendedItemDto[]>;
            const list = Array.isArray(json?.data) ? json.data : [];
            const grouped = byCategory(list);
            setRecoData({ top: grouped.top, bottom: grouped.bottom, outer: grouped.outer });
        } catch (e) {
            setRecoError(getUserMessage(e));
            setRecoData(null);
        } finally {
            setRecoLoading(false);
        }
    }, [effectiveSessionKey]);

    useEffect(() => {
        if (!openReco) return;
        void fetchTodayReco();
    }, [openReco, fetchTodayReco]);

    // ---------------------------
    // History (최근 3개) - endpoint 고정 유지
    // ---------------------------
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [history, setHistory] = useState<OutfitHistoryDto[]>([]);

    const fetchRecentHistory = useCallback(async () => {
        setHistoryLoading(true);
        setHistoryError(null);

        try {
            const res = await fetch(RECENT_HISTORY_ENDPOINT, {
                method: "GET",
                headers: { Accept: "application/json", "X-Session-Key": effectiveSessionKey },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = (await res.json()) as ApiResponse<OutfitHistoryDto[]>;
            const list = Array.isArray(json?.data) ? json.data : [];
            setHistory(list.slice(0, 3));
        } catch (e) {
            const msg = getUserMessage(e);
            setHistoryError(msg);

            // ✅ 서버 실패 시 reduxRecentHistory로 fallback
            if (Array.isArray(reduxRecentHistory) && reduxRecentHistory.length > 0) {
                setHistory((reduxRecentHistory as unknown as OutfitHistoryDto[]).slice(0, 3));
            } else {
                setHistory([]);
            }
        } finally {
            setHistoryLoading(false);
        }
    }, [effectiveSessionKey, reduxRecentHistory]);

    useEffect(() => {
        void fetchRecentHistory();
    }, [fetchRecentHistory]);

    // ---------------------------
    // ✅ Today Preview (adapter 기반, "진짜 데이터")
    // - today: outfitRepo.getTodayOutfit(sessionKey) (없으면 lastSaved fallback)
    // - weather: /api/weather/today (없으면 weatherVm fallback)
    // - summary: /api/clothes/summary
    // - feedback: 전날 > 오늘 > 없음
    // ---------------------------
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const [todayOutfit, setTodayOutfit] = useState<TodayOutfitDto | null>(null);
    const [weatherMini, setWeatherMini] = useState<TodayWeatherMiniDto | null>(null);
    const [summary, setSummary] = useState<ClothesSummaryItemDto[]>([]);

    const yesterdayISO = useMemo(() => toISO(new Date(Date.now() - 24 * 60 * 60 * 1000)), []);
    const effectiveFeedbackScore = useMemo(() => {
        // 1) 전날 피드백(서버 history or redux history)
        const y1 = (history as any[])?.find((x) => x?.outfitDate === yesterdayISO)?.feedbackScore;
        if (typeof y1 === "number") return y1;

        const y2 = (reduxRecentHistory as any[])?.find((x) => x?.dateISO === yesterdayISO)?.feedbackScore;
        if (typeof y2 === "number") return y2;

        // 2) 오늘 피드백(현재 outfit)
        const t = (todayOutfit as any)?.feedbackScore;
        if (typeof t === "number") return t;

        // 3) lastSaved에라도 있으면
        const ls = (lastSavedTodayOutfit as any)?.feedbackScore;
        if (typeof ls === "number") return ls;

        return null;
    }, [history, reduxRecentHistory, yesterdayISO, todayOutfit, lastSavedTodayOutfit]);

    const canGoChecklist = effectiveFeedbackScore == null;

    const fetchTodayPreview = useCallback(async () => {
        setPreviewLoading(true);
        setPreviewError(null);

        try {
            // 1) 오늘 아웃핏 (repo)
            let today: TodayOutfitDto | null = null;
            try {
                today = await outfitRepo.getTodayOutfit(effectiveSessionKey);
            } catch {
                // repo 실패 시 lastSaved fallback
                today = (lastSavedTodayOutfit as TodayOutfitDto) ?? null;
            }
            setTodayOutfit(today);

            // 2) 날씨 mini (/api/weather/today)
            let mini: TodayWeatherMiniDto | null = null;
            try {
                const wRes = await fetch(TODAY_WEATHER_ENDPOINT, {
                    method: "GET",
                    headers: { Accept: "application/json", "X-Session-Key": effectiveSessionKey },
                });
                if (wRes.ok) {
                    const wJson = (await wRes.json()) as ApiResponse<any>;
                    const d = wJson?.data ?? null;
                    mini = {
                        temperature: typeof d?.temperature === "number" ? d.temperature : null,
                        feelsLikeTemperature: typeof d?.feelsLikeTemperature === "number" ? d.feelsLikeTemperature : null,
                        sky: d?.sky ?? null,
                    };
                }
            } catch {
                // ignore
            }

            // fallback: weatherVm로 대체
            if (!mini && weatherVm) {
                mini = {
                    temperature: (weatherVm as any)?.temperature ?? (weatherVm as any)?.temp ?? null,
                    feelsLikeTemperature: (weatherVm as any)?.feelsLikeTemperature ?? (weatherVm as any)?.feelsLike ?? null,
                    sky: (weatherVm as any)?.sky ?? (weatherVm as any)?.condition ?? null,
                };
            }
            setWeatherMini(mini);

            // 3) summary
            const ids =
                Array.isArray(today?.items) && today?.items?.length
                    ? today!.items
                        .map((x) => x?.clothingId)
                        .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
                    : [];

            const s = await closetApi.getClothesSummary(ids);
            setSummary(s ?? []);
        } catch (e) {
            setPreviewError(getUserMessage(e));
            setTodayOutfit(null);
            setWeatherMini(null);
            setSummary([]);
        } finally {
            setPreviewLoading(false);
        }
    }, [effectiveSessionKey, lastSavedTodayOutfit, weatherVm]);

    useEffect(() => {
        void fetchTodayPreview();
    }, [fetchTodayPreview]);

    // adapter VM
    const previewVM = useMemo(() => {
        if (!todayOutfit) return null;

        const patchedToday: any = {
            ...todayOutfit,
            feedbackScore: effectiveFeedbackScore,
        };

        return buildTodayPreviewVM({
            today: patchedToday,
            weather: weatherMini,
            summary,
        });
    }, [todayOutfit, effectiveFeedbackScore, weatherMini, summary]);

    // ---------------------------
    // “오늘 날씨 리포트” 멘트
    // ---------------------------
    const conclusion = useMemo(() => {
        if (aiComment && aiComment.trim().length > 0) {
            const one = aiComment.replace(/\s+/g, " ").trim();
            return one.length > 38 ? `${one.slice(0, 38)}…` : one;
        }

        const fl = isFiniteNumber((weatherVm as any)?.feelsLike) ? (weatherVm as any).feelsLike : null;
        const wind = isFiniteNumber((weatherVm as any)?.windSpeed) ? (weatherVm as any).windSpeed : null;
        const pop = isFiniteNumber((weatherVm as any)?.pop) ? (weatherVm as any).pop : null;

        if (fl != null && fl <= 0) return "오늘은 체감 온도 대비 보온이 중요합니다.";
        if (wind != null && wind >= 6) return "오늘은 바람 대비 아우터 선택이 중요합니다.";
        if (pop != null && pop >= 50) return "오늘은 우산/방수 대비가 중요합니다.";
        return "오늘은 기본 레이어링으로 체온 유지가 중요합니다.";
    }, [aiComment, weatherVm]);

    const evidenceChips = useMemo(() => {
        const chips: Array<{ text: string; mock?: boolean; icon?: React.ReactNode }> = [];

        const tMax = isFiniteNumber((weatherVm as any)?.maxTemp) ? (weatherVm as any).maxTemp : null;
        const tMin = isFiniteNumber((weatherVm as any)?.minTemp) ? (weatherVm as any).minTemp : null;
        const fl = isFiniteNumber((weatherVm as any)?.feelsLike) ? (weatherVm as any).feelsLike : null;

        if (tMax != null && tMin != null) {
            chips.push({
                text: `큰 일교차 ${Math.round(tMax - tMin)}°C`,
                mock: false,
                icon: <ThermometerSun size={14} className="text-orange-500" />,
            });
        } else {
            chips.push({ text: "큰 일교차", mock: true, icon: <ThermometerSun size={14} className="text-orange-500" /> });
        }

        if (fl != null) {
            chips.push({
                text: fl <= 0 ? "체감 온도 낮음" : "체감 온도 보통",
                mock: false,
                icon: <Activity size={14} className="text-navy-900" />,
            });
        } else {
            chips.push({ text: "체감 온도 낮음", mock: true, icon: <Activity size={14} className="text-navy-900" /> });
        }

        return chips.slice(0, 3);
    }, [weatherVm]);

    // ---------------------------
    // “데이터 업데이트”
    // ---------------------------
    const onRefreshAll = useCallback(() => {
        refreshWeather();
        void fetchTodayReco();
        void fetchRecentHistory();
        void fetchTodayPreview();
    }, [refreshWeather, fetchTodayReco, fetchRecentHistory, fetchTodayPreview]);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SectionHeader
                title={`${displayName}님, 좋은 아침입니다!`}
                subtitle={`구로동의 현재 날씨와 ${displayName}님의 선호도를 반영한 오늘의 코디 요약입니다.`}
                action={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            icon={RefreshCw}
                            onClick={onRefreshAll}
                            disabled={weatherLoading || recoLoading || historyLoading || previewLoading}
                        >
                            데이터 업데이트
                        </Button>
                        <Button variant="secondary" size="sm" icon={MapPin}>
                            서울 구로동
                        </Button>
                    </>
                }
            />

            {weatherLoading ? <div className="text-sm font-bold text-slate-400">날씨 불러오는 중...</div> : null}
            {weatherError ? <div className="text-sm font-bold text-red-500">{weatherError}</div> : null}

            {weatherVm ? (
                <div className="relative overflow-visible">
                    <div className="absolute left-1/2 top-4 -translate-x-[110%] z-[50] pointer-events-auto">
                        <Tooltip
                            side="bottom"
                            align="end"
                            content={
                                <div className="space-y-2">
                                    <div className="text-[11px] font-black text-slate-800">데이터 안내</div>
                                    <div className="whitespace-pre-line text-[11px] font-bold text-slate-600 leading-5">
                                        OpenWeather 무료 API 기반이라 습도/풍속/강수확률은 실제 체감과 오차가 있을 수 있습니다.
                                    </div>
                                </div>
                            }
                        >
                            <button
                                type="button"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 bg-white/90 backdrop-blur text-slate-500 hover:bg-white"
                                aria-label="날씨 데이터 안내"
                            >
                                <Info size={14} />
                            </button>
                        </Tooltip>
                    </div>

                    <WeatherHeroSection data={weatherVm as any} />
                </div>
            ) : null}

            <div className="grid lg:grid-cols-12 gap-10">
                {/* LEFT */}
                <div className="lg:col-span-8 space-y-10">
                    <Card title="오늘 날씨 리포트">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="p-8 bg-navy-900 text-white rounded-[40px] shadow-2xl shadow-navy-900/20 relative overflow-hidden">
                                    <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/5" />

                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-xs font-black">
                                            AI
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Today Weather Report
                    </span>
                                    </div>

                                    <p className="text-xl font-black leading-snug">
                                        <span className="text-orange-400 mr-1">{displayName}님,</span>
                                        {conclusion}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {evidenceChips.map((c, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100"
                                            >
                                                {c.icon}
                                                {c.mock ? (
                                                    <span className="px-2 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
                            예시
                          </span>
                                                ) : null}
                                                <span>{c.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <ul className="space-y-4">
                                    {[
                                        {
                                            text:
                                                isFiniteNumber((weatherVm as any)?.feelsLike) && (weatherVm as any).feelsLike <= 0
                                                    ? "체감이 낮아 보온 레이어링을 우선 권장합니다."
                                                    : "기본 레이어링으로 컨디션 유지가 좋습니다.",
                                            color: "text-orange-500",
                                        },
                                        {
                                            text:
                                                isFiniteNumber((weatherVm as any)?.windSpeed) && (weatherVm as any).windSpeed >= 6
                                                    ? "바람이 강해 아우터 선택에 신경 쓰는 게 좋습니다."
                                                    : "바람 영향은 크지 않아 보입니다.",
                                            color: "text-emerald-500",
                                        },
                                        {
                                            text:
                                                isFiniteNumber((weatherVm as any)?.pop) && (weatherVm as any).pop >= 50
                                                    ? "강수 가능성이 있어 우산/방수 대비를 고려하세요."
                                                    : "강수 가능성은 낮은 편입니다.",
                                            color: "text-blue-500",
                                        },
                                    ].map((tip, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-navy-900/10 transition-colors"
                                        >
                                            <CheckCircle2 className={cn("shrink-0 mt-0.5", tip.color)} size={18} />
                                            <span className="text-sm font-bold text-slate-700">{tip.text}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button variant="primary" className="w-full h-14" onClick={() => setOpenReco(true)} disabled={recoLoading}>
                                    전체 코디 리스트 확인
                                </Button>

                                {recoLoading ? <div className="text-xs font-bold text-slate-400">추천 리스트 불러오는 중...</div> : null}
                                {recoError ? <div className="text-xs font-bold text-slate-500">{recoError}</div> : null}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT */}
                <div className="lg:col-span-4 space-y-10">
                    <Card title="최근 저장한 아웃핏" className="h-full">
                        <div className="space-y-8">
                            {/* 상태 */}
                            {previewLoading ? (
                                <div className="text-[11px] font-bold text-slate-400">데이터 병합 중...</div>
                            ) : null}
                            {previewError ? (
                                <div className="text-[11px] font-bold text-slate-400">미리보기 실패: {previewError}</div>
                            ) : null}
                            {previewVM ? (
                                <div className="rounded-3xl border border-slate-100 bg-white placeholder-amber-50">
                                    {/* 상단: 날짜(텍스트) + 날씨/피드백(칩) */}
                                    {(() => {
                                        const raw = previewVM.dateLine ?? ""; // "2026.01.13 • ☀️ -4° / 체감 -10° • 피드백 😐"
                                        const date = (raw.split("•")[0] ?? "").trim();

                                        const afterFirstDot = raw.split("•")[1]?.trim() ?? "";
                                        const skyEmoji = afterFirstDot ? afterFirstDot.split(" ")[0] : "🌤️";

                                        const fbEmoji = raw.includes("피드백")
                                            ? (raw.split("피드백")[1] ?? "").trim().slice(0, 2).trim()
                                            : "—";

                                        return (
                                            <div className="text-center">
                                                <div className="text-[12px] font-black text-slate-400 tracking-wide">
                                                    {date || "-"}
                                                </div>

                                                <div className="mt-4 flex items-center justify-center gap-6">
                                                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                                                        <span className="text-[11px] font-black text-slate-500">날씨</span>
                                                        <span className="text-[18px] leading-none">{skyEmoji}</span>
                                                    </div>

                                                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                                                        <span className="text-[11px] font-black text-slate-500">피드백</span>
                                                        <span className="text-[18px] leading-none">{fbEmoji || "—"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                        {/* 상의/하의/아우터만 */}
                                        <div className="mt-6 grid grid-cols-3 gap-4">
                                            {parseSlots(previewVM.slotLine)
                                                .slice(0, 3)
                                                .map((x) => (
                                                    <div
                                                        key={x.title}
                                                        className={cn(
                                                            "rounded-2xl p-5 text-center",
                                                            x.isMissing ? "bg-slate-50 text-slate-400" : "bg-white"
                                                        )}
                                                    >
                                                        <div className={cn("text-[36px] leading-none", x.isMissing && "opacity-40")}>
                                                            {x.icon}
                                                        </div>
                                                        <div className="mt-2 text-[12px] font-black text-slate-500">{x.title}</div>
                                                        <div
                                                            className={cn(
                                                                "mt-1 text-[12px] font-black",
                                                                x.isMissing ? "text-slate-400" : "text-slate-700"
                                                            )}
                                                        >
                                                            {x.isMissing ? "미선택" : "선택 완료"}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>

                                        {/* 저장된 값 있으면: 히스토리만 */}
                                        <div className="mt-4 flex items-center justify-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={HistoryIcon}
                                                onClick={() =>
                                                    navigate("/calendar", {
                                                        state: {
                                                            sessionKey: effectiveSessionKey,
                                                            recentlySaved: lastSavedTodayOutfit,
                                                            selectedSnapshot: selectedOutfitSnapshot,
                                                            recoModelKey,
                                                        },
                                                    })
                                                }
                                            >
                                                전체 히스토리 보기
                                            </Button>
                                        </div>
                                    </div>

                            ) : (
                                /* ✅ 저장된 값 없으면: 두 버튼 활성화 */
                                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 text-center">
                                    <div className="text-sm font-black text-slate-700">표시할 아웃핏이 없습니다</div>
                                    <div className="text-xs font-bold text-slate-500 mt-1 leading-5">
                                        저장된 아웃핏이 없으면
                                        <br />
                                        체크리스트로 이동해 추천을 생성하세요.
                                    </div>

                                    <div className="mt-4 flex items-center justify-center gap-3">
                                        <Button variant="primary" size="sm" onClick={() => navigate("/checklist")}>
                                            체크리스트 작성하기
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={HistoryIcon}
                                            onClick={() =>
                                                navigate("/calendar", {
                                                    state: {
                                                        sessionKey: effectiveSessionKey,
                                                        recentlySaved: lastSavedTodayOutfit,
                                                        selectedSnapshot: selectedOutfitSnapshot,
                                                        recoModelKey,
                                                    },
                                                })
                                            }
                                        >
                                            전체 히스토리 보기
                                        </Button>
                                    </div>

                                    {historyError ? (
                                        <div className="mt-3 text-[11px] font-bold text-slate-400">
                                            히스토리 로드 실패: {historyError}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* 최근 3개 리스트 */}
                            <div className="space-y-3">
                                {historyLoading ? (
                                    <>
                                        <SkeletonBlock className="h-16 w-full" />
                                        <SkeletonBlock className="h-16 w-full" />
                                        <SkeletonBlock className="h-16 w-full" />
                                    </>
                                ) : history.length === 0 ? null : (
                                    history.slice(0, 3).map((h) => (
                                        <div
                                            key={String(h.id)}
                                            className="rounded-2xl border border-slate-100 bg-white p-4 hover:border-slate-200 hover:shadow-sm transition cursor-pointer"
                                            onClick={() =>
                                                navigate("/calendar", {
                                                    state: {
                                                        sessionKey: effectiveSessionKey,
                                                        recentlySaved: lastSavedTodayOutfit,
                                                        selectedSnapshot: selectedOutfitSnapshot,
                                                        recoModelKey,
                                                    },
                                                })
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-[11px] font-bold text-slate-500 truncate">
                                                        {formatDateKR((h as any)?.outfitDate)} • 피드백{" "}
                                                        {typeof (h as any)?.feedbackScore === "number" ? (h as any).feedbackScore : "—"}
                                                    </div>
                                                    <div className="mt-1 text-sm font-black text-slate-900 truncate">
                                                        👕/👖/🧥 히스토리 상세 보기
                                                    </div>
                                                </div>
                                                <div className="text-slate-300">›</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <TodayRecoByCategoryModal open={openReco} onClose={() => setOpenReco(false)} loading={recoLoading} error={recoError} data={recoData} />
        </div>
    );
};

export default TodayPage;