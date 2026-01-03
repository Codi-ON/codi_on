// src/pages/user/RecommendationPage.tsx
import React, { useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Badge, Stepper, cn } from "@/app/DesignSystem";
import { ChevronLeft, ChevronRight, CheckCircle, Calendar as CalendarIcon } from "lucide-react";

import OutfitFeedbackCard from "@/pages/user/_components/OutfitFeedbackCard";
import type { TodayOutfitDto } from "@/lib/api/outfitApi";

import { useAppDispatch, useAppSelector } from "@/state/hooks/hooks";
import {
    fetchRecommendation,
    saveTodayOutfitThunk,
    setIdx,
    setSelectedOutfitSnapshot,
} from "@/state/outfitReco/outfitRecoSlice";

const steps = ["날씨 분석", "활동 체크", "스타일 생성", "최종 제안"];

type CalendarSelectedOutfit = {
    top?: { clothingId: number; name: string; brand?: string; imageUrl?: string; inCloset?: boolean };
    bottom?: { clothingId: number; name: string; brand?: string; imageUrl?: string; inCloset?: boolean };
    outer?: { clothingId: number; name: string; brand?: string; imageUrl?: string; inCloset?: boolean };
};

const RecommendationPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const {
        checklist,
        recoList,
        topIdx,
        bottomIdx,
        outerIdx,
        loading,
        error,
        saving,
        saveError,
        recoFeedbackScore,
    } = useAppSelector((s) => s.outfitReco);

    // ✅ checklist 없으면 이 페이지 들어오면 안됨
    useEffect(() => {
        if (!checklist) navigate("/checklist", { replace: true });
    }, [checklist, navigate]);

    // ✅ recoList 없을 때만 fetch
    useEffect(() => {
        if (!checklist) return;
        if (recoList) return;
        if (loading) return;
        dispatch(fetchRecommendation());
    }, [dispatch, checklist, recoList, loading]);

    // ✅ 선택 조합
    const selectedOutfit = useMemo(() => {
        if (!recoList) return null;
        if (!recoList.top.length || !recoList.bottom.length) return null;

        return {
            top: recoList.top[topIdx],
            bottom: recoList.bottom[bottomIdx],
            outer: recoList.outer.length ? recoList.outer[outerIdx] : undefined,
        };
    }, [recoList, topIdx, bottomIdx, outerIdx]);

    const selectedForCalendar: CalendarSelectedOutfit | null = useMemo(() => {
        if (!selectedOutfit) return null;
        const to = (x: any) =>
            x
                ? {
                    clothingId: x.clothingId,
                    name: x.name,
                    brand: x.brand,
                    imageUrl: x.imageUrl,
                    inCloset: x.inCloset,
                }
                : undefined;

        return {
            top: to(selectedOutfit.top),
            bottom: to(selectedOutfit.bottom),
            outer: to(selectedOutfit.outer),
        };
    }, [selectedOutfit]);

    const isOuterOptionalEmpty = !!recoList && recoList.outer.length === 0;

    const canSave = useMemo(() => {
        if (!selectedOutfit) return false;
        return typeof selectedOutfit.top?.clothingId === "number" && typeof selectedOutfit.bottom?.clothingId === "number";
    }, [selectedOutfit]);

    const saveTodayOutfit = useCallback(async () => {
        if (!canSave || !selectedForCalendar) return;

        try {
            // ✅ 저장 직전에 “캘린더/히스토리로 넘길 스냅샷”을 확정
            dispatch(setSelectedOutfitSnapshot());

            const today = await dispatch(saveTodayOutfitThunk()).unwrap();

            // ✅ 백엔드가 feedbackScore를 즉시 내려주지 않는 경우를 대비 (UI 즉시 반영)
            const patchedToday = ({
                ...today,
                feedbackScore: (today as any).feedbackScore ?? recoFeedbackScore,
            } as unknown) as TodayOutfitDto;

            const date = patchedToday?.date;
            const url = date ? `/calendar?date=${encodeURIComponent(String(date).slice(0, 10))}` : "/calendar";

            navigate(url, {
                state: {
                    recentlySaved: patchedToday,
                    selectedOutfit: selectedForCalendar,
                },
            });
        } catch {
            // saveError는 slice에서 관리됨
        }
    }, [dispatch, navigate, canSave, selectedForCalendar, recoFeedbackScore]);

    // --- UI states ---
    if (loading) {
        return (
            <div className="space-y-10">
                <Stepper steps={steps} currentStep={3} />
                <Card className="p-14 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">추천 조합 생성 중...</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">체크리스트 기반 후보를 필터링하고 있습니다.</div>
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
                            체크리스트로 돌아가기
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                dispatch(fetchRecommendation());
                            }}
                            className="h-11 px-8"
                        >
                            다시 시도
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!recoList) {
        return (
            <div className="space-y-10">
                <Stepper steps={steps} currentStep={3} />
                <Card className="p-14 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">추천 후보 데이터가 없습니다</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">다시 진행해 주세요.</div>
                    <div className="mt-8">
                        <Button onClick={() => navigate("/checklist")} className="h-11 px-8">
                            체크리스트로 돌아가기
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!recoList.top.length || !recoList.bottom.length || !selectedOutfit) {
        return (
            <div className="space-y-10">
                <Stepper steps={steps} currentStep={3} />
                <Card className="p-14 text-center border-2 border-slate-100">
                    <div className="text-2xl font-black text-navy-900">추천 후보가 부족합니다</div>
                    <div className="mt-2 text-sm text-slate-400 font-medium">옷장 데이터가 부족하거나 필터 조건이 너무 강해요.</div>
                    <div className="mt-8">
                        <Button onClick={() => navigate("/checklist")} className="h-11 px-8">
                            체크리스트로 돌아가기
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
        list: any[];
        index: number;
        onPrev: () => void;
        onNext: () => void;
        isOptionalEmpty?: boolean;
    }) => {
        const hasItems = list.length > 0;
        const item = hasItems ? list[index] : undefined;

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div className="text-sm font-black text-slate-500 flex items-center gap-2">
                        <span>{title}</span>
                        {isOptionalEmpty ? <Badge variant="slate">옵션</Badge> : null}
                    </div>
                    <div className="text-xs font-black text-slate-300">{hasItems ? `${index + 1}/${list.length}` : "0/0"}</div>
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
                            <div className="text-[11px] font-black text-slate-300 tracking-widest uppercase">
                                {title} · {hasItems ? (item?.brand ?? "CODION").toString() : "CODION"}
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
                                        <span className="text-sm font-black text-slate-300">·</span>
                                        <span className="text-sm font-black text-slate-400">후보 교체</span>
                                    </>
                                ) : (
                                    <span className="text-sm font-black text-slate-400">{isOptionalEmpty ? "아우터는 옵션이라 없어도 저장돼요" : "조건을 완화해 주세요"}</span>
                                )}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                                {hasItems
                                    ? list.map((_: any, i: number) => (
                                        <span key={i} className={cn("w-2.5 h-2.5 rounded-full", i === index ? "bg-orange-500" : "bg-slate-200")} />
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

            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    <Card className="lg:col-span-7 p-7 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-black text-slate-300 tracking-widest uppercase">구성 아이템 선택</div>
                                <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">오늘의 추천 조합</div>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="slate">후보 교체 가능</Badge>
                                {isOuterOptionalEmpty ? <Badge variant="slate">아우터 없음(옵션)</Badge> : null}
                            </div>
                        </div>

                        <div className="mt-7 space-y-7">
                            <Chooser
                                title="상의"
                                list={recoList.top}
                                index={topIdx}
                                onPrev={() => dispatch(setIdx({ topIdx: (topIdx - 1 + recoList.top.length) % recoList.top.length }))}
                                onNext={() => dispatch(setIdx({ topIdx: (topIdx + 1) % recoList.top.length }))}
                            />
                            <Chooser
                                title="하의"
                                list={recoList.bottom}
                                index={bottomIdx}
                                onPrev={() => dispatch(setIdx({ bottomIdx: (bottomIdx - 1 + recoList.bottom.length) % recoList.bottom.length }))}
                                onNext={() => dispatch(setIdx({ bottomIdx: (bottomIdx + 1) % recoList.bottom.length }))}
                            />
                            <Chooser
                                title="아우터"
                                list={recoList.outer}
                                index={recoList.outer.length ? outerIdx : 0}
                                isOptionalEmpty={isOuterOptionalEmpty}
                                onPrev={() => {
                                    if (recoList.outer.length === 0) return;
                                    dispatch(setIdx({ outerIdx: (outerIdx - 1 + recoList.outer.length) % recoList.outer.length }));
                                }}
                                onNext={() => {
                                    if (recoList.outer.length === 0) return;
                                    dispatch(setIdx({ outerIdx: (outerIdx + 1) % recoList.outer.length }));
                                }}
                            />
                        </div>
                    </Card>

                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
                        <Card className="p-7 border-2 border-slate-100 shadow-2xl shadow-navy-900/[0.03]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs font-black text-slate-300 tracking-widest uppercase">최종 미리보기</div>
                                    <div className="mt-2 text-2xl font-black text-navy-900 tracking-tight">선택한 조합</div>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="h-11 px-5 text-sm font-black whitespace-nowrap shadow-2xl shadow-orange-500/20"
                                    onClick={saveTodayOutfit}
                                    isLoading={saving}
                                    disabled={!canSave || saving}
                                >
                                    {saving ? "저장 중..." : "캘린더에 저장하기"}
                                    <CalendarIcon className="ml-2" size={18} />
                                </Button>
                            </div>

                            {!canSave && (
                                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    저장할 아이템이 없습니다. (상의/하의는 필수예요)
                                </div>
                            )}

                            {saveError && (
                                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {saveError}
                                </div>
                            )}

                            <div className="mt-7 grid grid-cols-3 gap-3">
                                {[
                                    { label: "상의", item: selectedOutfit.top },
                                    { label: "하의", item: selectedOutfit.bottom },
                                    { label: "아우터", item: selectedOutfit.outer },
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

                            <div className="mt-6 rounded-[12px] border border-slate-100 bg-slate-50 px-5 py-4">
                                <div className="text-sm font-bold text-slate-600">저장 후 캘린더로 이동합니다.</div>
                            </div>
                        </Card>

                        {/* ✅ 추천에 대한 피드백(좋아요/모르겠어요/별로예요) */}
                        <OutfitFeedbackCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationPage;