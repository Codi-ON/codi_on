// src/pages/user/RecommendationPage.tsx
import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Badge, Stepper, cn } from "@/app/DesignSystem";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Calendar as CalendarIcon,
    AlertTriangle,
    Info,
    X,
} from "lucide-react";

import OutfitFeedbackCard from "@/pages/user/_components/OutfitFeedbackCard";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";

import { useAppSelector } from "@/state/hooks/hooks";
import type { ChecklistSubmitDto } from "@/shared/domain/checklist";

import { recoApi } from "@/lib/api/recoApi";
import { outfitRepo } from "@/lib/repo/outfitRepo";

const steps = ["날씨 분석", "활동 체크", "스타일 생성", "최종 제안"];

// ✅ 첫 진입 토스트 플래그
const GUIDE_TOAST_KEY = "codion.reco.guideToastShown.v1";

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

const clampIndex = (idx: number, len: number) => {
    if (len <= 0) return 0;
    return Math.min(Math.max(idx, 0), len - 1);
};

function normalizeCandidatesResponse(raw: any): CandidatesData {
    // 케이스1) { success, data: { models... } }
    if (raw && typeof raw === "object" && "success" in raw && "data" in raw) {
        return raw.data as CandidatesData;
    }
    // 케이스2) { models... }
    return raw as CandidatesData;
}

/**
 * 후보가 많아도 화면은 3개만 (UX 단순화)
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

// ✅ 모델 설명(짧게만)
const MODEL_UI: Record<string, { label: string; desc: string }> = {
    BLEND_RATIO: { label: "기본 추천", desc: "전체 밸런스를 기준으로 추천" },
    MATERIAL_RATIO: { label: "소재 기준", desc: "소재/텍스처 중심으로 추천" },
};

const RecommendationPage: React.FC = () => {
    const navigate = useNavigate();

    const checklist = useAppSelector((s) => s.outfitReco.checklist as ChecklistSubmitDto | null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState<CandidatesData | null>(null);

    // 모델 탭
    const [selectedModelType, setSelectedModelType] = useState<string | null>(null);

    // chooser index
    const [topIdx, setTopIdx] = useState(0);
    const [bottomIdx, setBottomIdx] = useState(0);
    const [outerIdx, setOuterIdx] = useState(0);

    // 저장 상태
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // 옷 부족 안내(나가기)
    const [showInsufficientModal, setShowInsufficientModal] = useState(false);

    // ✅ 첫 진입 토스트(3초)
    const [showGuideToast, setShowGuideToast] = useState(false);

    // ✅ checklist 없으면 이 페이지 들어오면 안됨
    useEffect(() => {
        if (!checklist) navigate("/checklist", { replace: true });
    }, [checklist, navigate]);

    // ✅ 최초 1회 토스트
    useEffect(() => {
        try {
            const shown = localStorage.getItem(GUIDE_TOAST_KEY);
            if (shown === "1") return;

            setShowGuideToast(true);
            localStorage.setItem(GUIDE_TOAST_KEY, "1");

            const t = window.setTimeout(() => setShowGuideToast(false), 3000);
            return () => window.clearTimeout(t);
        } catch {
            // localStorage 막혀있어도 토스트는 1회만(세션 기준) 보여주도록
            setShowGuideToast(true);
            const t = window.setTimeout(() => setShowGuideToast(false), 3000);
            return () => window.clearTimeout(t);
        }
    }, []);

    // ✅ candidates 로드
    const fetchCandidates = useCallback(async () => {
        if (!checklist) return;

        setLoading(true);
        setError(null);

        try {
            const raw = await recoApi.getCandidates({
                region: "Seoul",
                lat: 37.5665,
                lon: 126.978,
                topNPerCategory: 10,
                checklist,
            } as any);

            const normalized = normalizeCandidatesResponse(raw);
            setData(normalized);

            const firstModelType = normalized?.models?.[0]?.modelType ?? null;
            setSelectedModelType((prev) => prev ?? firstModelType);

            setTopIdx(0);
            setBottomIdx(0);
            setOuterIdx(0);
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
        const key = selectedModel?.modelType;
        return key ? MODEL_UI[key] ?? null : null;
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

    const isOuterOptionalEmpty = recoList.outer.length === 0;

    const insufficient = useMemo(() => {
        return recoList.top.length === 0 || recoList.bottom.length === 0;
    }, [recoList.top.length, recoList.bottom.length]);

    useEffect(() => {
        if (!loading && !error && data && insufficient) {
            setShowInsufficientModal(true);
        }
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
    };

    const saveTodayOutfit = useCallback(async () => {
        if (!canSave || !selectedOutfit) return;

        setSaving(true);
        setSaveError(null);

        try {
            const clothingIds = [selectedOutfit.top.clothingId, selectedOutfit.bottom.clothingId, selectedOutfit.outer?.clothingId]
                .filter((v): v is number => typeof v === "number");

            const saved = await outfitRepo.saveTodayOutfit(clothingIds);

            const patchedSaved = (saved as unknown) as TodayOutfitDto;
            const date = (patchedSaved as any)?.date;
            const url = date ? `/calendar?date=${encodeURIComponent(String(date).slice(0, 10))}` : "/calendar";

            navigate(url, {
                state: {
                    recentlySaved: patchedSaved,
                    selectedOutfit: {
                        top: selectedOutfit.top,
                        bottom: selectedOutfit.bottom,
                        outer: selectedOutfit.outer,
                    },
                },
            });
        } catch (e: any) {
            setSaveError(e?.response?.data?.message || e?.message || "오늘 아웃핏 저장 실패");
        } finally {
            setSaving(false);
        }
    }, [canSave, selectedOutfit, navigate]);

    // ---------- UI ----------
    if (loading) {
        return (
            <div className="space-y-10">
                <Stepper steps={steps} currentStep={3} />
                <Card className="p-14 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">추천 조합 생성 중...</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">후보를 계산하고 있어요.</div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-10">
                <Stepper steps={steps} currentStep={3} />
                <Card className="p-14 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">추천 불러오기 실패</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">{error}</div>

                    <div className="mt-8 flex items-center justify-center gap-3">
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
            <div className="space-y-10">
                <Stepper steps={steps} currentStep={3} />
                <Card className="p-14 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">후보 데이터가 없습니다</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">다시 진행해 주세요.</div>
                    <div className="mt-8">
                        <Button onClick={() => navigate("/checklist")} className="h-11 px-8">
                            체크리스트로
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const Chooser = ({
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

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div className="text-sm font-black text-slate-500 flex items-center gap-2">
                        <span>{title}</span>
                        {isOptionalEmpty ? <Badge variant="slate">옵션</Badge> : null}
                    </div>
                    <div className="text-xs font-black text-slate-300">{hasItems ? `${safeIndex + 1}/${list.length}` : "0/0"}</div>
                </div>

                <div className="rounded-[28px] border-2 border-slate-100 bg-white p-5">
                    <div className="grid grid-cols-[120px_1fr] gap-5 items-center">
                        <div className="relative w-[120px] h-[120px]">
                            <div className="w-full h-full rounded-[26px] bg-slate-100 overflow-hidden border border-slate-200">
                                {hasItems && item?.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-300">
                                        {isOptionalEmpty ? "NO OUTER" : "NO IMG"}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={onPrev}
                                disabled={!hasItems || list.length <= 1}
                                className={cn(
                                    "absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center hover:bg-slate-50",
                                    (!hasItems || list.length <= 1) && "opacity-40 pointer-events-none"
                                )}
                                aria-label="prev"
                            >
                                <ChevronLeft />
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!hasItems || list.length <= 1}
                                className={cn(
                                    "absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center hover:bg-slate-50",
                                    (!hasItems || list.length <= 1) && "opacity-40 pointer-events-none"
                                )}
                                aria-label="next"
                            >
                                <ChevronRight />
                            </button>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="text-[11px] font-black text-slate-300 tracking-widest uppercase">
                                    {title}
                                    {item?.color ? ` · ${item.color}` : ""}
                                </div>
                                {item?.favorited ? <Badge variant="orange">찜</Badge> : null}
                                {typeof item?.score === "number" ? <Badge variant="slate">{item.score}</Badge> : null}
                            </div>

                            <div className="mt-1 text-xl font-black text-navy-900 truncate">
                                {hasItems ? item?.name : isOptionalEmpty ? "오늘은 아우터 추천이 없어요" : "추천 없음"}
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                                {hasItems ? (
                                    <>
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <CheckCircle size={16} />
                                            <span className="text-sm font-black">{item?.inCloset === false ? "미보관" : "옷장 보관 중"}</span>
                                        </div>
                                        {item?.analysis ? (
                                            <>
                                                <span className="text-sm font-black text-slate-300">·</span>
                                                <span className="text-sm font-black text-slate-400 truncate">{item.analysis}</span>
                                            </>
                                        ) : null}
                                    </>
                                ) : (
                                    <span className="text-sm font-black text-slate-400">
                    {isOptionalEmpty ? "아우터는 옵션이라 없어도 저장돼요" : "조건을 완화해 주세요"}
                  </span>
                                )}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                                {hasItems
                                    ? list.map((_, i) => (
                                        <span key={i} className={cn("w-2.5 h-2.5 rounded-full", i === safeIndex ? "bg-orange-500" : "bg-slate-200")} />
                                    ))
                                    : Array.from({ length: 3 }).map((_, i) => (
                                        <span key={i} className="w-2.5 h-2.5 rounded-full bg-slate-200 opacity-40" />
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <Stepper steps={steps} currentStep={3} />

            {/* ✅ 첫 진입 1회 토스트(3초) */}
            {showGuideToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(680px,calc(100%-24px))]">
                    <div className="rounded-[18px] border border-slate-100 bg-white shadow-2xl px-4 py-3 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                            <Info className="text-orange-500" size={18} />
                        </div>

                        <div className="min-w-0">
                            <div className="text-sm font-black text-navy-900">빠른 사용법</div>
                            <div className="mt-1 text-xs font-bold text-slate-500">
                                1) 모델 선택 → 2) 좌/우로 후보 변경 → 3) 캘린더에 저장
                            </div>
                        </div>

                        <button
                            onClick={() => setShowGuideToast(false)}
                            className="ml-auto w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center"
                            aria-label="close"
                        >
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ 옷 부족 안내: 나가기(옷 등록) */}
            {showInsufficientModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-[24px] bg-white border border-slate-100 shadow-2xl p-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                <AlertTriangle className="text-orange-500" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-black text-navy-900">옷이 부족해요</div>
                                <div className="mt-1 text-sm font-medium text-slate-500">
                                    상의/하의 후보가 부족해서 추천 정확도가 낮습니다.
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

                        <button
                            className="mt-4 w-full text-xs font-bold text-slate-400 hover:text-slate-600"
                            onClick={() => setShowInsufficientModal(false)}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT */}
                    <Card className="lg:col-span-7 p-7 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-black text-slate-300 tracking-widest uppercase">구성 아이템 선택</div>
                                <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">오늘의 추천 조합</div>
                                {/* ✅ 최소 설명 1줄(행동 유도) */}
                                <div className="mt-2 text-xs font-bold text-slate-400">
                                    좌/우 버튼으로 후보를 바꾸고 조합을 완성하세요.
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                {aiUsedAny ? <Badge variant="orange">AI</Badge> : <Badge variant="slate">RULE</Badge>}
                                {isProbablyDummy ? <Badge variant="slate">DUMMY</Badge> : null}
                                {isOuterOptionalEmpty ? <Badge variant="slate">아우터 없음(옵션)</Badge> : null}
                            </div>
                        </div>

                        {/* ✅ 모델 선택 탭 + 최소 설명 */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between px-1">
                                <div className="text-sm font-black text-slate-500">모델 선택</div>
                                {selectedModelUI?.label ? <Badge variant="orange">{selectedModelUI.label}</Badge> : <Badge variant="slate">기준 변경</Badge>}
                            </div>

                            <div className="mt-2 text-xs font-bold text-slate-400">모델을 바꾸면 추천 기준이 달라집니다.</div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {models.map((m) => {
                                    const active = m.modelType === (selectedModel?.modelType ?? "");
                                    return (
                                        <button
                                            key={m.modelType}
                                            onClick={() => onChangeModel(m.modelType)}
                                            className={cn(
                                                "px-4 h-10 rounded-full border-2 text-sm font-black transition-all",
                                                active
                                                    ? "bg-navy-900 border-navy-900 text-white shadow-lg shadow-navy-900/20"
                                                    : "bg-white border-slate-100 text-slate-500 hover:border-orange-500/30 hover:bg-orange-50/30"
                                            )}
                                        >
                                            {m.modelType}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-black text-slate-500">
                                    {selectedModelUI?.desc ?? "추천 기준이 다른 모델로 결과를 비교할 수 있어요."}
                                </div>
                            </div>
                        </div>

                        {insufficient ? (
                            <div className="mt-6 rounded-[16px] border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                                상의/하의 후보가 부족합니다. 옷을 더 등록하면 정확도가 올라갑니다.
                            </div>
                        ) : null}

                        <div className="mt-7 space-y-7">
                            <Chooser
                                title="상의"
                                list={recoList.top}
                                index={topIdx}
                                onPrev={() => setTopIdx((prev) => (recoList.top.length ? (prev - 1 + recoList.top.length) % recoList.top.length : 0))}
                                onNext={() => setTopIdx((prev) => (recoList.top.length ? (prev + 1) % recoList.top.length : 0))}
                            />

                            <Chooser
                                title="하의"
                                list={recoList.bottom}
                                index={bottomIdx}
                                onPrev={() =>
                                    setBottomIdx((prev) =>
                                        recoList.bottom.length ? (prev - 1 + recoList.bottom.length) % recoList.bottom.length : 0
                                    )
                                }
                                onNext={() => setBottomIdx((prev) => (recoList.bottom.length ? (prev + 1) % recoList.bottom.length : 0))}
                            />

                            <Chooser
                                title="아우터"
                                list={recoList.outer}
                                index={recoList.outer.length ? outerIdx : 0}
                                isOptionalEmpty={isOuterOptionalEmpty}
                                onPrev={() =>
                                    setOuterIdx((prev) =>
                                        recoList.outer.length ? (prev - 1 + recoList.outer.length) % recoList.outer.length : 0
                                    )
                                }
                                onNext={() => setOuterIdx((prev) => (recoList.outer.length ? (prev + 1) % recoList.outer.length : 0))}
                            />
                        </div>
                    </Card>

                    {/* RIGHT */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
                        <Card className="p-7 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs font-black text-slate-300 tracking-widest uppercase">최종 미리보기</div>
                                    <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">선택한 조합</div>
                                    {/* ✅ 최소 설명 1줄(저장 의미) */}
                                    <div className="mt-2 text-xs font-bold text-slate-400">저장하면 캘린더에 오늘 코디로 기록됩니다.</div>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="h-11 px-5 text-sm font-black whitespace-nowrap shadow-2xl shadow-orange-500/20"
                                    onClick={saveTodayOutfit}
                                    isLoading={saving}
                                    disabled={!canSave || saving || insufficient}
                                >
                                    {saving ? "저장 중..." : "캘린더에 저장"}
                                    <CalendarIcon className="ml-2" size={18} />
                                </Button>
                            </div>

                            {!canSave && (
                                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    저장할 아이템이 없습니다. (상의/하의 필수)
                                </div>
                            )}

                            {insufficient && (
                                <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                                    후보 부족으로 저장을 막았습니다. 옷 등록 후 다시 시도하세요.
                                </div>
                            )}

                            {saveError && (
                                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {saveError}
                                </div>
                            )}

                            <div className="mt-7 grid grid-cols-3 gap-3">
                                {[
                                    { label: "상의", item: selectedOutfit?.top },
                                    { label: "하의", item: selectedOutfit?.bottom },
                                    { label: "아우터", item: selectedOutfit?.outer },
                                ].map(({ label, item }) => (
                                    <div key={label} className="rounded-[24px] border border-slate-100 bg-white p-4 text-center">
                                        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                                            {item?.imageUrl ? (
                                                <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300">
                                                    NO IMG
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2 text-[10px] font-black text-slate-300 tracking-widest uppercase">{label}</div>
                                        <div className="mt-1 text-sm font-black text-navy-900 truncate">{item?.name ?? "-"}</div>

                                        <div className="mt-2 flex items-center justify-center gap-2 text-emerald-600">
                                            <CheckCircle size={14} />
                                            <span className="text-[11px] font-black">{item?.inCloset === false ? "미보관" : "옷장 보관"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* 피드백 */}
                        <OutfitFeedbackCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationPage;