// src/pages/user/TodayPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SectionHeader, Card, Button, cn } from "../../app/DesignSystem";
import { WeatherHeroSection } from "../../shared/ui/sections/WeatherHeroSection";
import {
    MapPin,
    RefreshCw,
    Sparkles,
    ChevronRight,
    CheckCircle2,
    History,
    ThermometerSun,
    Activity,
} from "lucide-react";

import OutfitQuickRecoModal, {
    RecommendationClosetList,
} from "@/pages/user/_components/OutfitQuickRecoModal";

import { useWeather } from "@/lib/hooks/useWeather";
import { normalizeWeeklyTo7, pickTomorrow, lastWeekly, WeatherData } from "@/shared/domain/weather";

import { fetchFavorites } from "@/state/favorites/favoritesSlice";
import type { RootState, AppDispatch } from "@/app/store";
import { getUserMessage } from "@/lib/errors";
import { closetRepo } from "@/lib/repo/closetRepo";

// ---- TodayPage에서 필요한 최소 필드만 ----
type ClothesItemDto = {
    id: number;
    clothingId: number;
    name: string;
    category: "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";
    imageUrl?: string | null;
    brand?: string | null;
};

const TodayPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const region = "Seoul";

    // ✅ 로그인 닉네임 / 게스트 분기
    const sessionNickname = useSelector((s: RootState) => (s as any).session?.nickname as string | undefined);
    const isLoggedIn = useSelector((s: RootState) => Boolean((s as any).session?.isLoggedIn));
    const displayName = useMemo(() => {
        const nick = (sessionNickname ?? "").trim();
        return isLoggedIn && nick ? nick : "Guest";
    }, [isLoggedIn, sessionNickname]);

    // ---------------------------
    // Weather
    // ---------------------------
    const { data: weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } =
        useWeather(region);

    const [openReco, setOpenReco] = useState(false);

    const weatherVm: WeatherData | null = useMemo(() => {
        if (!weather) return null;
        const weekly7 = normalizeWeeklyTo7(weather);
        return { ...weather, weekly: weekly7 };
    }, [weather]);

    const weekly7 = weatherVm?.weekly ?? [];
    useMemo(() => pickTomorrow(weekly7), [weekly7]);
    useMemo(() => lastWeekly(weekly7), [weekly7]);

    const contextChips = useMemo(() => {
        if (!weatherVm) return ["날씨 로딩 중", "—", "—"];
        const diff = weatherVm.maxTemp - weatherVm.minTemp;
        return [`${weatherVm.temp}°C`, `일교차 ${diff}°C`, `체감 ${weatherVm.feelsLike}°C`];
    }, [weatherVm]);

    // ---------------------------
    // Favorites (Redux)
    // ---------------------------
    const favoriteIds = useSelector((s: RootState) => s.favorites.ids);
    const favoriteSet = useMemo(() => new Set<number>(favoriteIds), [favoriteIds]);

    useEffect(() => {
        dispatch(fetchFavorites());
    }, [dispatch]);

    // ---------------------------
    // Clothes (Public)
    // ---------------------------
    const [clothes, setClothes] = useState<ClothesItemDto[]>([]);
    const [clothesLoading, setClothesLoading] = useState(false);
    const [clothesError, setClothesError] = useState<string | null>(null);

    const refreshClothes = async () => {
        setClothesLoading(true);
        setClothesError(null);
        try {
            const list = (await closetRepo.getClothes({ limit: 30 })) as unknown as ClothesItemDto[];
            setClothes(Array.isArray(list) ? list : []);
        } catch (e) {
            setClothesError(getUserMessage(e));
            setClothes([]);
        } finally {
            setClothesLoading(false);
        }
    };

    useEffect(() => {
        refreshClothes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------------------
    // QuickRecoModal data (real)
    // ---------------------------
    const recoList: RecommendationClosetList = useMemo(() => {
        const grouped: RecommendationClosetList = { top: [], bottom: [], outer: [] };

        for (const dto of clothes) {
            // favorites merge(확장 가능)
            favoriteSet.has(dto.clothingId);

            const uiItem = {
                id: dto.clothingId,
                label: dto.category === "TOP" ? "상의" : dto.category === "BOTTOM" ? "하의" : "아우터",
                name: dto.name,
                brand: dto.brand ?? undefined,
                imageUrl: dto.imageUrl ?? null,
                inCloset: true,
            };

            switch (dto.category) {
                case "TOP":
                    grouped.top.push(uiItem as any);
                    break;
                case "BOTTOM":
                    grouped.bottom.push(uiItem as any);
                    break;
                case "OUTER":
                    grouped.outer.push(uiItem as any);
                    break;
                case "ONE_PIECE":
                    break;
            }
        }

        return grouped;
    }, [clothes, favoriteSet]);

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
                            onClick={() => {
                                refreshWeather();
                                refreshClothes();
                                dispatch(fetchFavorites());
                            }}
                            disabled={weatherLoading || clothesLoading}
                        >
                            데이터 업데이트
                        </Button>
                        <Button variant="secondary" size="sm" icon={MapPin}>
                            서울 구로동
                        </Button>
                    </>
                }
            />

            {weatherLoading && <div className="text-sm font-bold text-slate-400">날씨 불러오는 중...</div>}
            {weatherError && <div className="text-sm font-bold text-red-500">{weatherError}</div>}

            {weatherVm && <WeatherHeroSection data={weatherVm} />}

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    <Card title="AI 스타일링 분석 리포트" subtitle="데이터 기반 맞춤형 의복 지수 분석">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="p-8 bg-navy-900 text-white rounded-[40px] shadow-2xl shadow-navy-900/20 relative overflow-hidden">
                                    <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/5" />
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-xs font-black">
                                            AI
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Personal Stylist Insight
                    </span>
                                    </div>
                                    <p className="text-xl font-bold leading-snug">
                                        오늘 {displayName}님은 실내 활동 위주이므로, 기온차를 대비한 가벼운 니트와 통기성이 좋은 슬랙스를
                                        매치해보세요.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                        오늘의 주요 추천 사유
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                                            <ThermometerSun size={14} className="text-orange-500" />
                                            {weatherVm ? `일교차 ${weatherVm.maxTemp - weatherVm.minTemp}°C` : "일교차 —"}
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                                            <Activity size={14} className="text-navy-900" /> 낮은 활동량 선호
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                                            <Sparkles size={14} className="text-blue-500" /> 최근 즐겨찾는 색감
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <ul className="space-y-4">
                                    {[
                                        { text: "오전 10시까지 윈드브레이커 권장", color: "text-orange-500" },
                                        { text: "자외선 지수가 높으니 린넨 소재 추천", color: "text-emerald-500" },
                                        { text: "오후 6시 이후 갑작스러운 풍속 증가 대비", color: "text-blue-500" },
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

                                <Button
                                    variant="primary"
                                    className="w-full h-14"
                                    onClick={() => setOpenReco(true)}
                                    disabled={clothesLoading}
                                >
                                    전체 코디 리스트 확인
                                </Button>

                                {clothesLoading && <div className="text-xs font-bold text-slate-400">옷 목록 불러오는 중...</div>}
                                {clothesError && <div className="text-xs font-bold text-slate-500">{clothesError}</div>}
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <Card title="최근 코디 히스토리" className="h-full">
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 group-hover:shadow-lg transition-all">
                                        <img
                                            src={`https://picsum.photos/100/100?random=${i + 20}`}
                                            alt="History"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-black text-navy-900 truncate">어반 미니멀 룩</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                            2024.05.{15 - i} · 18°C ☀️
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-navy-900 transition-colors" size={16} />
                                </div>
                            ))}

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-[10px] uppercase tracking-widest font-black"
                                icon={History}
                                onClick={() => navigate("/history")}
                            >
                                전체 히스토리 보기
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <OutfitQuickRecoModal
                open={openReco}
                onClose={() => setOpenReco(false)}
                recoList={recoList}
                contextChips={contextChips}
                onGoRecommendation={() => setOpenReco(false)}
            />
        </div>
    );
};

export default TodayPage;