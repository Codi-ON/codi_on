// src/pages/user/RecommendationPage.tsx
import React, {useEffect, useMemo, useCallback, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Card, Button, Badge, Stepper, cn} from "@/app/DesignSystem";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Calendar as CalendarIcon,
    AlertTriangle,
    Info,
    X,
    Heart,
    ChevronUp,
    ChevronDown,
} from "lucide-react";

import {useAppDispatch, useAppSelector} from "@/state/hooks/hooks";
import type { ChecklistState } from "@/shared/domain/checklist";

import {recoApi} from "@/lib/api/recoApi";
import {outfitRepo} from "@/lib/repo/outfitRepo";

import {fetchFavorites, optimisticSet, toggleFavorite} from "@/state/favorites/favoritesSlice";

const steps = ["날씨 분석", "활동 체크", "스타일 생성", "최종 제안"];
const GUIDE_TOAST_KEY = "codion.reco.guideToastShown.v2";

/** ---------- Types ---------- */
type CandidateItem = {
    clothingId: number;
    name: string;
    color?: string | null;
    imageUrl?: string | null;
    favorited?: boolean;
    score?: number | null;
    analysis?: string | null;
    inCloset?: boolean;
};

type CandidateCategory = {
    category: string;
    aiUsed: boolean;
    candidates: CandidateItem[];
};

type CandidateModel = {
    modelType: string;
    categories: CandidateCategory[];
};

type CandidatesData = {
    recommendationKey?: string;
    models: CandidateModel[];
};

type ClosetItem = {
    id: string | number;
    clothingId: number;
    label: "상의" | "하의" | "아우터";
    name: string;
    brand?: string;
    imageUrl?: string;
    inCloset?: boolean;
    favorited?: boolean;
    score?: number;
    analysis?: string;
    color?: string;
};

type RecoList = {
    top: ClosetItem[];
    bottom: ClosetItem[];
    outer: ClosetItem[];
};

type ActiveTab = "TOP" | "BOTTOM" | "OUTER";

/** ✅ TS2322 방지: 탭 타입 명시 */
type VisibleTab = {
    key: ActiveTab;
    label: string;
    count: number;
    disabled: boolean;
};

/** ---------- Utils ---------- */
const clampIndex = (idx: number, len: number) => {
    if (len <= 0) return 0;
    return Math.min(Math.max(idx, 0), len - 1);
};

function normalizeCandidatesResponse(raw: any): CandidatesData {
    if (raw && typeof raw === "object" && "success" in raw && "data" in raw) {
        return raw.data as CandidatesData;
    }
    return raw as CandidatesData;
}

/**
 * 후보가 많아도 화면은 3개만 (컴팩트 UX)
 * - 길이 >= 7 → 1,5,7
 * - 길이 < 7  → 1,3,5
 */
function pick3<T>(arr: T[]): T[] {
    if (!arr?.length) return [];
    const indices = arr.length >= 7 ? [0, 4, 6] : [0, 2, 4];
    const picked = indices.filter((i) => i < arr.length).map((i) => arr[i]);
    return picked.length ? picked : [arr[0]];
}

function toClosetItem(x: CandidateItem, label: ClosetItem["label"]): ClosetItem {
    return {
        id: x.clothingId ?? `${label}-${Math.random()}`,
        clothingId: x.clothingId,
        label,
        name: x.name,
        brand: "CODION",
        imageUrl: x.imageUrl ?? undefined,
        inCloset: x.inCloset ?? true,
        favorited: x.favorited ?? false,
        score: typeof x.score === "number" ? x.score : undefined,
        analysis: x.analysis ?? undefined,
        color: x.color ?? undefined,
    };
}

function buildRecoListByModel(model: CandidateModel | null): RecoList {
    const categories = model?.categories ?? [];

    const byCat = (cat: string) => {
        const found = categories.find((c) => String(c?.category).toUpperCase() === cat);
        const list = Array.isArray(found?.candidates) ? found!.candidates : [];
        const valid = list.filter((x) => x && typeof x.clothingId === "number" && typeof x.name === "string");
        return pick3(valid);
    };

    return {
        top: byCat("TOP").map((x) => toClosetItem(x, "상의")),
        bottom: byCat("BOTTOM").map((x) => toClosetItem(x, "하의")),
        outer: byCat("OUTER").map((x) => toClosetItem(x, "아우터")),
    };
}

/** ---------- Model UI (rename + short copy) ---------- */
const MODEL_UI: Record<string, { label: string; short: string }> = {
    MATERIAL_RATIO: {
        label: "소재기반",
        short: "소재/두께 기반 쾌적함 점수",
    },
    BLEND_RATIO: {
        label: "혼용률 기반",
        short: "혼방률 특성 기반 적합도 점수",
    },
};

/** ---------- Page ---------- */
const RecommendationPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // ✅ Redux 안에는 ChecklistSubmitDto & { recommendationId } 가 들어있고
    // 여기서는 ChecklistState 로 캐스팅해서 사용
    const checklist = useAppSelector((s) => s.outfitReco.checklist as ChecklistState | null);

    const favoritesIds = useAppSelector((s) => s.favorites.ids);
    const favoritesLoading = useAppSelector((s) => s.favorites.loading);

    const favoriteSet = useMemo(() => new Set(favoritesIds), [favoritesIds]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<CandidatesData | null>(null);

    // model
    const [selectedModelType, setSelectedModelType] = useState<string | null>(null);

    // indices
    const [topIdx, setTopIdx] = useState(0);
    const [bottomIdx, setBottomIdx] = useState(0);
    const [outerIdx, setOuterIdx] = useState(0);

    // active tab
    const [activeTab, setActiveTab] = useState<ActiveTab>("TOP");

    // save + feedback modal
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackSaving, setFeedbackSaving] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);
    const [savedDateISO, setSavedDateISO] = useState<string | null>(null);

    // insufficient modal
    const [showInsufficientModal, setShowInsufficientModal] = useState(false);

    // guide toast
    const [showGuideToast, setShowGuideToast] = useState(false);

    // decision panel fold
    const [decisionOpen, setDecisionOpen] = useState(true);

    // checklist gate
    useEffect(() => {
        if (!checklist) navigate("/checklist", {replace: true});
    }, [checklist, navigate]);

    // favorites preload
    useEffect(() => {
        dispatch(fetchFavorites());
    }, [dispatch]);

    // first toast
    useEffect(() => {
        try {
            const shown = localStorage.getItem(GUIDE_TOAST_KEY);
            if (shown === "1") return;

            setShowGuideToast(true);
            localStorage.setItem(GUIDE_TOAST_KEY, "1");

            const t = window.setTimeout(() => setShowGuideToast(false), 2200);
            return () => window.clearTimeout(t);
        } catch {
            setShowGuideToast(true);
            const t = window.setTimeout(() => setShowGuideToast(false), 2200);
            return () => window.clearTimeout(t);
        }
    }, []);

    const fetchCandidates = useCallback(async () => {
        if (!checklist) return;

        setLoading(true);
        setError(null);

        try {
            // ✅ 방어: recommendationId 없으면 바로 에러
            if (!checklist.recommendationId) {
                throw new Error("추천 ID가 없습니다. 체크리스트부터 다시 진행해 주세요.");
            }

            const raw = await recoApi.getCandidates({
                region: "Seoul",
                lat: 37.5665,
                lon: 126.978,
                topNPerCategory: 10,

                // ✅ 새 계약: top-level recommendationId
                recommendationId: checklist.recommendationId,

                // ✅ 새 계약: checklist 필드만 내부 객체로 전달
                checklist: {
                    usageType: checklist.usageType,
                    thicknessLevel: checklist.thicknessLevel,
                    activityLevel: checklist.activityLevel,
                    yesterdayFeedback: checklist.yesterdayFeedback,
                },
            } as any);

            const normalized = normalizeCandidatesResponse(raw);
            setData(normalized);

            const firstModelType = normalized?.models?.[0]?.modelType ?? null;
            setSelectedModelType((prev) => prev ?? firstModelType);

            setTopIdx(0);
            setBottomIdx(0);
            setOuterIdx(0);
            setActiveTab("TOP");
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || "추천 불러오기 실패");
        } finally {
            setLoading(false);
        }
    }, [checklist]);

    useEffect(() => {
        fetchCandidates();
    }, [fetchCandidates]);

    const models = useMemo(() => data?.models ?? [], [data]);

    const selectedModel = useMemo(() => {
        if (!models.length) return null;
        const found = models.find((m) => m.modelType === selectedModelType);
        return found ?? models[0];
    }, [models, selectedModelType]);

    const selectedModelUI = useMemo(() => {
        const key = selectedModel?.modelType ?? "";
        return MODEL_UI[key] ?? null;
    }, [selectedModel]);

    const recoList = useMemo(() => buildRecoListByModel(selectedModel), [selectedModel]);

    const aiUsedAny = useMemo(() => {
        const cats = selectedModel?.categories ?? [];
        return cats.some((c) => c.aiUsed);
    }, [selectedModel]);

    const isProbablyDummy = useMemo(() => {
        const cats = selectedModel?.categories ?? [];
        const all = cats.flatMap((c) => c.candidates ?? []);
        if (!all.length) return false;
        const dummyCount = all.filter((x) => String(x?.name ?? "").toLowerCase().includes("dummy")).length;
        return dummyCount / all.length >= 0.6;
    }, [selectedModel]);

    const selectedOutfit = useMemo(() => {
        if (!recoList.top.length || !recoList.bottom.length) return null;

        const safeTopIdx = clampIndex(topIdx, recoList.top.length);
        const safeBottomIdx = clampIndex(bottomIdx, recoList.bottom.length);
        const safeOuterIdx = recoList.outer.length ? clampIndex(outerIdx, recoList.outer.length) : 0;

        return {
            top: recoList.top[safeTopIdx],
            bottom: recoList.bottom[safeBottomIdx],
            outer: recoList.outer.length ? recoList.outer[safeOuterIdx] : undefined,
        };
    }, [recoList, topIdx, bottomIdx, outerIdx]);

    const isOuterEmpty = recoList.outer.length === 0;

    const insufficient = useMemo(() => {
        return recoList.top.length === 0 || recoList.bottom.length === 0;
    }, [recoList.top.length, recoList.bottom.length]);

    useEffect(() => {
        if (!loading && !error && data && insufficient) setShowInsufficientModal(true);
    }, [loading, error, data, insufficient]);

    const canSave = useMemo(() => {
        if (!selectedOutfit) return false;
        return typeof selectedOutfit.top?.clothingId === "number" && typeof selectedOutfit.bottom?.clothingId === "number";
    }, [selectedOutfit]);

    const onChangeModel = (modelType: string) => {
        setSelectedModelType(modelType);
        setTopIdx(0);
        setBottomIdx(0);
        setOuterIdx(0);
        setActiveTab("TOP");
    };

    const saveTodayOutfit = useCallback(async () => {
        if (!canSave || !selectedOutfit) return;

        setSaving(true);
        setSaveError(null);

        try {
            // ✅ 서버 저장용 payload (sortOrder 포함)
            const items = [
                { clothingId: selectedOutfit.top.clothingId, sortOrder: 1 },
                { clothingId: selectedOutfit.bottom.clothingId, sortOrder: 2 },
                ...(typeof selectedOutfit.outer?.clothingId === "number"
                    ? [{ clothingId: selectedOutfit.outer.clothingId, sortOrder: 3 }]
                    : []),
            ];

            // ✅ recoStrategy(=선택 모델) 같이 저장
            const saved = await outfitRepo.saveTodayOutfit({
                items,
                recoStrategy: selectedModel?.modelType ?? null,
                // recommendationKey: data?.recommendationKey ?? null, // 백에서 받으면 같이 보내
            });

            const dateISO = String((saved as any)?.date ?? "").slice(0, 10);
            setSavedDateISO(dateISO || null);

            if (dateISO) {
                setFeedbackError(null);
                setFeedbackModalOpen(true);
            }
        } catch (e: any) {
            setSaveError(e?.response?.data?.message || e?.message || "오늘 아웃핏 저장 실패");
        } finally {
            setSaving(false);
        }
    }, [
        canSave,
        selectedOutfit,
        selectedModel?.modelType,
        // data?.recommendationKey,
    ]);

    const submitFeedback = useCallback(
        async (rating: -1 | 0 | 1) => {
            if (!savedDateISO) return;

            setFeedbackSaving(true);
            setFeedbackError(null);

            try {
                await outfitRepo.postOutfitFeedbackByDate(savedDateISO, rating);
                setFeedbackModalOpen(false);

                navigate(`/calendar?date=${encodeURIComponent(savedDateISO)}`, {
                    state: {
                        selectedOutfit: selectedOutfit ? {
                            top: selectedOutfit.top,
                            bottom: selectedOutfit.bottom,
                            outer: selectedOutfit.outer
                        } : null,
                        modelType: selectedModel?.modelType ?? null,
                        recommendationKey: data?.recommendationKey ?? null,
                    },
                });
            } catch (e: any) {
                setFeedbackError(e?.response?.data?.message || e?.message || "피드백 저장 실패");
            } finally {
                setFeedbackSaving(false);
            }
        },
        [savedDateISO, navigate, selectedOutfit, selectedModel?.modelType, data?.recommendationKey]
    );

    const skipFeedbackAndGoCalendar = useCallback(() => {
        const dateISO = savedDateISO;
        setFeedbackModalOpen(false);
        if (!dateISO) return navigate("/calendar");
        navigate(`/calendar?date=${encodeURIComponent(dateISO)}`, {
            state: {
                selectedOutfit: selectedOutfit ? {
                    top: selectedOutfit.top,
                    bottom: selectedOutfit.bottom,
                    outer: selectedOutfit.outer
                } : null,
                modelType: selectedModel?.modelType ?? null,
                recommendationKey: data?.recommendationKey ?? null,
            },
        });
    }, [savedDateISO, navigate, selectedOutfit, selectedModel?.modelType, data?.recommendationKey]);

    /** ---------- Favorites toggle (optimistic) ---------- */
    const onToggleFavorite = useCallback(
        (clothingId?: number) => {
            if (!Number.isFinite(clothingId)) return;

            const has = favoriteSet.has(clothingId!);
            const next = !has;

            dispatch(optimisticSet({clothingId: clothingId!, next}));
            dispatch(toggleFavorite({clothingId: clothingId!, next}));
        },
        [dispatch, favoriteSet]
    );

    /** ---------- Score helpers ---------- */
    const outfitScore = useMemo(() => {
        const scores: number[] = [];
        if (typeof selectedOutfit?.top?.score === "number") scores.push(selectedOutfit.top.score);
        if (typeof selectedOutfit?.bottom?.score === "number") scores.push(selectedOutfit.bottom.score);
        if (typeof selectedOutfit?.outer?.score === "number") scores.push(selectedOutfit.outer.score);
        if (!scores.length) return null;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }, [selectedOutfit]);

    const ScorePill = ({score}: { score: number | null }) => (
        <span className="inline-flex items-center px-3 h-8 rounded-full bg-navy-900 text-white text-xs font-black">
      적합성 점수 : {typeof score === "number" ? score : "-"}
    </span>
    );

    const FavoriteButton = ({
                                active,
                                disabled,
                                onClick,
                                size = 34,
                            }: {
        active: boolean;
        disabled?: boolean;
        onClick: () => void;
        size?: number;
    }) => (
        <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "rounded-full border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center transition",
                disabled && "opacity-40 pointer-events-none"
            )}
            style={{width: size, height: size}}
            aria-label={active ? "unfavorite" : "favorite"}
            title={active ? "찜 해제" : "찜"}
        >
            <Heart size={18} className={cn(active ? "text-red-500 fill-red-500" : "text-slate-300")}/>
        </button>
    );

    /** ---------- Compact Chooser (one-card) ---------- */
    const ChooserCard = ({
                             title,
                             list,
                             index,
                             onPrev,
                             onNext,
                             isOptionalEmpty,
                         }: {
        title: "상의" | "하의" | "아우터";
        list: ClosetItem[];
        index: number;
        onPrev: () => void;
        onNext: () => void;
        isOptionalEmpty?: boolean;
    }) => {
        const hasItems = list.length > 0;
        const safeIndex = hasItems ? clampIndex(index, list.length) : 0;
        const item = hasItems ? list[safeIndex] : undefined;

        const disableNav = !hasItems || list.length <= 1;

        return (
            <div className="rounded-[24px] border-2 border-slate-100 bg-white p-4">
                {/* body */}
                <div className="mt-3 relative rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                    {/* arrows: 카드 가운데 좌/우 */}
                    <button
                        onClick={onPrev}
                        disabled={disableNav}
                        className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center hover:bg-slate-50",
                            disableNav && "opacity-40 pointer-events-none"
                        )}
                        aria-label="prev"
                    >
                        <ChevronLeft size={18}/>
                    </button>
                    <button
                        onClick={onNext}
                        disabled={disableNav}
                        className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center hover:bg-slate-50",
                            disableNav && "opacity-40 pointer-events-none"
                        )}
                        aria-label="next"
                    >
                        <ChevronRight size={18}/>
                    </button>

                    <div className="grid grid-cols-[104px_1fr] gap-4 items-center px-12">
                        {/* image */}
                        <div className="w-[104px] h-[104px]">
                            <div
                                className="w-full h-full rounded-[22px] bg-white overflow-hidden border border-slate-200">
                                {hasItems && item?.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"/>
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center text-[11px] font-black text-slate-300">
                                        {isOptionalEmpty ? "NO OUTER" : "NO IMG"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* text */}
                        <div className="min-w-0">
                            <div className="text-[10px] font-black text-slate-300 tracking-widest uppercase">
                                {title}
                                {item?.color ? ` · ${item.color}` : ""}
                            </div>

                            <div className="mt-1 text-lg font-black text-navy-900 truncate">
                                {hasItems ? item?.name : isOptionalEmpty ? "오늘은 아우터 추천이 없어요" : "추천 없음"}
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                                {hasItems ? (
                                    <>
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <CheckCircle size={16}/>
                                            <span
                                                className="text-sm font-black">{item?.inCloset === false ? "미보관" : "옷장 보관"}</span>
                                        </div>

                                        {item?.analysis ? (
                                            <>
                                                <span className="text-sm font-black text-slate-200">·</span>
                                                <span
                                                    className="text-sm font-black text-slate-400 truncate">{item.analysis}</span>
                                            </>
                                        ) : null}
                                    </>
                                ) : (
                                    <span
                                        className="text-sm font-black text-slate-400">{isOptionalEmpty ? "아우터는 없어도 저장돼요" : "조건을 완화해 주세요"}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * ✅ Active tab binding (훅은 return 위에서만!)
     * - TS2322 해결: VisibleTab 명시 + base를 VisibleTab[]로 선언
     */
    const visibleTabs: VisibleTab[] = useMemo(() => {
        const base: VisibleTab[] = [
            {key: "TOP", label: "상의", count: recoList.top.length, disabled: recoList.top.length === 0},
            {key: "BOTTOM", label: "하의", count: recoList.bottom.length, disabled: recoList.bottom.length === 0},
            // OUTER는 조건부로 추가
        ];

        if (!isOuterEmpty) {
            base.push({key: "OUTER", label: "아우터", count: recoList.outer.length, disabled: false});
        }
        return base;
    }, [recoList.top.length, recoList.bottom.length, recoList.outer.length, isOuterEmpty]);

    useEffect(() => {
        if (activeTab === "OUTER" && isOuterEmpty) setActiveTab("TOP");
    }, [activeTab, isOuterEmpty]);

    const tabList = activeTab === "TOP" ? recoList.top : activeTab === "BOTTOM" ? recoList.bottom : recoList.outer;

    const tabTitle: "상의" | "하의" | "아우터" = activeTab === "TOP" ? "상의" : activeTab === "BOTTOM" ? "하의" : "아우터";

    const tabIndex = activeTab === "TOP" ? topIdx : activeTab === "BOTTOM" ? bottomIdx : outerIdx;

    const setTabIndex = activeTab === "TOP" ? setTopIdx : activeTab === "BOTTOM" ? setBottomIdx : setOuterIdx;

    const isTabOptionalEmpty = activeTab === "OUTER" && isOuterEmpty;

    /** ---------- Screen states (훅 아래로 내려오면 안 됨) ---------- */
    if (loading) {
        return (
            <div className="space-y-6">
                <Stepper steps={steps} currentStep={3}/>
                <Card className="p-10 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">추천 조합 생성 중...</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">후보를 계산하고 있어요.</div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Stepper steps={steps} currentStep={3}/>
                <Card className="p-10 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">추천 불러오기 실패</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">{error}</div>

                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Button onClick={() => navigate("/checklist")} className="h-11 px-8">
                            체크리스트로
                        </Button>
                        <Button variant="outline" onClick={fetchCandidates} className="h-11 px-8">
                            다시 시도
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!data || !models.length) {
        return (
            <div className="space-y-6">
                <Stepper steps={steps} currentStep={3}/>
                <Card className="p-10 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">후보 데이터가 없습니다</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">다시 진행해 주세요.</div>
                    <div className="mt-6">
                        <Button onClick={() => navigate("/checklist")} className="h-11 px-8">
                            체크리스트로
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 overflow-x-hidden">
            <div className="mb-4">
                <Stepper steps={steps} currentStep={3}/>
            </div>

            {/* guide toast */}
            {showGuideToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(680px,calc(100%-24px))]">
                    <div
                        className="rounded-[18px] border border-slate-100 bg-white shadow-2xl px-4 py-3 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                            <Info className="text-orange-500" size={18}/>
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-black text-navy-900">빠른 사용</div>
                            <div className="mt-1 text-xs font-bold text-slate-500">1) 모델 선택 → 2) 탭에서 후보 변경 → 3) 저장 후
                                피드백
                            </div>
                        </div>
                        <button
                            onClick={() => setShowGuideToast(false)}
                            className="ml-auto w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center"
                            aria-label="close"
                        >
                            <X size={18} className="text-slate-400"/>
                        </button>
                    </div>
                </div>
            )}

            {/* insufficient modal */}
            {showInsufficientModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-[24px] bg-white border border-slate-100 shadow-2xl p-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                <AlertTriangle className="text-orange-500"/>
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-black text-navy-900">옷이 부족해요</div>
                                <div className="mt-1 text-sm font-medium text-slate-500">상의/하의 후보가 부족해서 추천 정확도가 낮습니다.
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Button className="h-11" onClick={() => navigate("/closet")}>
                                옷 등록
                            </Button>
                            <Button variant="outline" className="h-11" onClick={() => navigate("/checklist")}>
                                체크리스트
                            </Button>
                        </div>

                        <button className="mt-4 w-full text-xs font-bold text-slate-400 hover:text-slate-600"
                                onClick={() => setShowInsufficientModal(false)}>
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* feedback modal */}
            {feedbackModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-[24px] bg-white border border-slate-100 shadow-2xl p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-lg font-black text-navy-900">오늘 코디는 어땠나요?</div>
                                <div className="mt-1 text-sm font-medium text-slate-500">저장한 조합에 대한 반응을 남기면 다음 추천이 더
                                    좋아져요.
                                </div>
                            </div>
                            <button
                                className="w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center"
                                onClick={skipFeedbackAndGoCalendar}
                                aria-label="close"
                            >
                                <X size={18} className="text-slate-400"/>
                            </button>
                        </div>

                        {feedbackError && (
                            <div
                                className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{feedbackError}</div>
                        )}

                        <div className="mt-6 grid grid-cols-3 gap-3">
                            {([
                                {score: 1 as const, emoji: "👍", text: "좋아요"},
                                {score: 0 as const, emoji: "😐", text: "그럭저럭"},
                                {score: -1 as const, emoji: "👎", text: "별로예요"},
                            ] as const).map((x) => (
                                <button
                                    key={x.score}
                                    disabled={feedbackSaving}
                                    onClick={() => submitFeedback(x.score)}
                                    className={cn(
                                        "h-24 rounded-[20px] border-2 border-slate-100 bg-white hover:bg-slate-50 transition",
                                        feedbackSaving && "opacity-60 pointer-events-none"
                                    )}
                                >
                                    <div className="text-2xl font-black">{x.emoji}</div>
                                    <div className="mt-2 text-sm font-black text-slate-600">{x.text}</div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4">
                            <Button variant="outline" className="w-full h-11" onClick={skipFeedbackAndGoCalendar}
                                    disabled={feedbackSaving}>
                                나중에 할게요
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* main grid */}
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-5 items-start">
                    {/* LEFT */}
                    <Card className="lg:col-span-7 p-5 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
                        {/* header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-[11px] font-black text-slate-300 tracking-widest uppercase">스타일
                                    추천
                                </div>
                                <div className="mt-1 text-xl font-black text-navy-900 tracking-tight">오늘의 추천 조합</div>
                                <div className="mt-1 text-xs font-bold text-slate-400">탭에서 아이템을 바꿔 조합을 완성하고, 저장 후 피드백을
                                    남기세요.
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {aiUsedAny ? <Badge variant="orange">AI</Badge> : <Badge variant="slate">RULE</Badge>}
                                {isProbablyDummy ? <Badge variant="slate">DUMMY</Badge> : null}
                            </div>
                        </div>

                        {/* model selector */}
                        <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-black text-slate-600">모델 선택</div>

                                <div className="flex items-center gap-2">
                                    {selectedModelUI ? (
                                        <></>
                                    ) : (
                                        <Badge variant="slate">기준</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                                {models.map((m) => {
                                    const active = m.modelType === (selectedModel?.modelType ?? "");
                                    const ui = MODEL_UI[m.modelType] ?? null;

                                    return (
                                        <button
                                            key={m.modelType}
                                            onClick={() => onChangeModel(m.modelType)}
                                            className={cn(
                                                "px-4 h-10 rounded-full border-2 text-sm font-black transition-all inline-flex items-center gap-2",
                                                active
                                                    ? "bg-navy-900 border-navy-900 text-white shadow-lg shadow-navy-900/20"
                                                    : "bg-white border-slate-100 text-slate-500 hover:border-orange-500/30 hover:bg-orange-50/30"
                                            )}
                                            title={ui?.short ?? m.modelType}
                                        >
                                            {ui?.label ?? m.modelType}
                                            <span
                                                className={cn("text-[11px] font-black", active ? "text-white/70" : "text-slate-300")}>{ui?.short ?? ""}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {insufficient ? (
                                <div
                                    className="mt-3 rounded-[14px] border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                                    상의/하의 후보가 부족합니다. 옷을 더 등록하면 정확도가 올라갑니다.
                                </div>
                            ) : null}
                        </div>

                        {/* tabs */}
                        <div className="mt-4">
                            <div className="flex items-center gap-2">
                                {visibleTabs.map((t) => {
                                    const active = activeTab === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            onClick={() => setActiveTab(t.key)}
                                            className={cn(
                                                "h-10 px-4 rounded-full border-2 text-sm font-black transition",
                                                active
                                                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                    : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                                            )}
                                            disabled={t.disabled}
                                            aria-disabled={t.disabled}
                                        >
                                            {t.label}
                                            <span
                                                className={cn("ml-2 text-[11px] font-black", active ? "text-white/80" : "text-slate-300")}>{t.count}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-3">
                                <ChooserCard
                                    title={tabTitle}
                                    list={tabList}
                                    index={tabIndex}
                                    isOptionalEmpty={isTabOptionalEmpty}
                                    onPrev={() => {
                                        const len = tabList.length;
                                        setTabIndex((prev) => (len ? (prev - 1 + len) % len : 0));
                                    }}
                                    onNext={() => {
                                        const len = tabList.length;
                                        setTabIndex((prev) => (len ? (prev + 1) % len : 0));
                                    }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* RIGHT: Decision Panel + fold */}
                    <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
                        <Card className="p-5 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
                            {/* header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div
                                        className="text-[11px] font-black text-slate-300 tracking-widest uppercase">Decision
                                        Panel
                                    </div>
                                    <div className="mt-1 text-xl font-black text-navy-900 tracking-tight">선택한 옷</div>

                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        className="w-10 h-10 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-center"
                                        onClick={() => setDecisionOpen((v) => !v)}
                                        aria-label="toggle-panel"
                                        title={decisionOpen ? "접기" : "펼치기"}
                                    >
                                        {decisionOpen ? <ChevronUp size={18} className="text-slate-400"/> :
                                            <ChevronDown size={18} className="text-slate-400"/>}
                                    </button>

                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="h-11 px-5 text-sm font-black whitespace-nowrap shadow-2xl shadow-orange-500/20"
                                        onClick={saveTodayOutfit}
                                        isLoading={saving}
                                        disabled={!canSave || saving || insufficient}
                                    >
                                        {saving ? "저장 중..." : "캘린더에 저장"}
                                        <CalendarIcon className="ml-2" size={18}/>
                                    </Button>
                                </div>
                            </div>

                            {!canSave && (
                                <div
                                    className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    저장할 아이템이 없습니다. (상의/하의 필수)
                                </div>
                            )}

                            {insufficient && (
                                <div
                                    className="mt-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                                    후보 부족으로 저장을 막았습니다. 옷 등록 후 다시 시도하세요.
                                </div>
                            )}

                            {saveError && (
                                <div
                                    className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{saveError}</div>
                            )}

                            {decisionOpen && (
                                <>
                                    {/* model + outfit score strip */}
                                    <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <Badge variant="orange">{selectedModelUI?.label ?? "모델"}</Badge>
                                            <ScorePill score={outfitScore}/>
                                        </div>
                                    </div>

                                    {/* receipt items (3 fixed slots) */}
                                    <div className="mt-5 grid grid-cols-3 gap-3">
                                        {([
                                            {label: "상의" as const, item: selectedOutfit?.top},
                                            {label: "하의" as const, item: selectedOutfit?.bottom},
                                            {label: "아우터" as const, item: selectedOutfit?.outer},
                                        ] as const).map(({label, item}) => {
                                            const exists = !!item && Number.isFinite(item.clothingId);
                                            const clothingId = exists ? item!.clothingId : undefined;
                                            const fav = exists ? favoriteSet.has(clothingId!) : false;

                                            return (
                                                <div key={label}
                                                     className={cn("rounded-[22px] border border-slate-100 bg-white p-4", !exists && "opacity-70")}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div
                                                            className="text-[10px] font-black text-slate-300 tracking-widest uppercase">{label}</div>

                                                        <FavoriteButton
                                                            active={fav}
                                                            disabled={!exists || favoritesLoading}
                                                            onClick={() => onToggleFavorite(clothingId)}
                                                            size={34}
                                                        />
                                                    </div>

                                                    <div
                                                        className="mt-3 w-full aspect-square rounded-[18px] bg-slate-100 overflow-hidden border border-slate-200"
                                                        title={item?.name ?? ""}>
                                                        {exists && item?.imageUrl ? (
                                                            <img src={item.imageUrl}
                                                                 className="w-full h-full object-cover"
                                                                 alt={item.name}/>
                                                        ) : (
                                                            <div
                                                                className="w-full h-full flex items-center justify-center text-[11px] font-black text-slate-300">
                                                                {label === "아우터" ? "NO OUTER" : "NO IMG"}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between gap-2">
                            <span
                                className="inline-flex px-4 h-7 items-center rounded-full bg-navy-900 text-white text-[11px] font-black">
                               {typeof item?.score === "number" ? Math.round(item.score) : "."}
                            </span>

                                                        <div className="flex items-center gap-3 text-emerald-600">
                                                            <CheckCircle size={20}/>
                                                            <span
                                                                className="text-[12px] font-black">{exists ? (item?.inCloset === false ? "" : "") : "-"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* notice (model) */}
                                    <div className="mt-4 rounded-[16px] border border-slate-100 bg-slate-50 px-4 py-3.5">
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-[2px] w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                                                <Info size={16} className="text-slate-400" />
                                            </div>

                                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                                점수는 <span className="text-navy-900">‘예상 적합도’</span>이며 실제 체감과 다를 수 있습니다.
                                                <br />모델 변경 시 점수/추천이 재정렬됩니다.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationPage;