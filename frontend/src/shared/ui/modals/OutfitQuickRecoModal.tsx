// src/shared/ui/modals/OutfitQuickRecoModal.tsx
import React from "react";
import { Card, Button, Badge } from "@/app/DesignSystem";
import type { ClothingUi, ClothingCategory } from "@/shared/domain/clothing";
import { categoryLabelKo } from "@/shared/domain/clothing";

export type OutfitRecoItem = ClothingUi & {
    // 모달에서만 쓰는 확장(필요하면)
    inCloset?: boolean; // 지금은 추천만 붙이니까 optional
};

export type RecommendationClosetList = {
    top: OutfitRecoItem[];
    bottom: OutfitRecoItem[];
    outer: OutfitRecoItem[];
    onePiece: OutfitRecoItem[];
};

type Props = {
    open: boolean;
    onClose: () => void;
    recoList: RecommendationClosetList;
    contextChips?: string[];
    onGoRecommendation?: () => void;

    // 좋아요 토글은 나중에 붙이기 쉽게 optional로만 열어둠
    onToggleFavorite?: (clothingId: number, next: boolean) => void;
};

const Section: React.FC<{
    title: string;
    items: OutfitRecoItem[];
    onToggleFavorite?: Props["onToggleFavorite"];
}> = ({ title, items, onToggleFavorite }) => {
    if (!items?.length) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-black text-slate-900">{title}</div>
                <div className="text-[10px] font-black text-slate-400">{items.length}개</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {items.map((it) => (
                    <div
                        key={it.clothingId}
                        className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                    >
                        <div className="aspect-square bg-slate-100 overflow-hidden">
                            {it.imageUrl ? (
                                <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                    NO IMAGE
                                </div>
                            )}
                        </div>

                        <div className="p-3 space-y-2">
                            <div className="text-[11px] font-black text-slate-900 line-clamp-1">
                                {it.name}
                            </div>

                            <div className="flex flex-wrap gap-1">
                                <Badge variant="slate">{categoryLabelKo(it.category as ClothingCategory)}</Badge>
                                <Badge variant="slate">{`${it.suitableMinTemp}~${it.suitableMaxTemp}°C`}</Badge>
                            </div>

                            {onToggleFavorite && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => onToggleFavorite(it.clothingId, !it.favorited)}
                                >
                                    {it.favorited ? "♥ 좋아요" : "♡ 좋아요"}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OutfitQuickRecoModal: React.FC<Props> = ({
                                                   open,
                                                   onClose,
                                                   recoList,
                                                   contextChips = [],
                                                   onGoRecommendation,
                                                   onToggleFavorite,
                                               }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl p-4">
                <Card className="rounded-[28px] border border-slate-200 bg-white shadow-2xl">
                    <div className="p-6 space-y-6">
                        <div className="flex items-start justify-between gap-6">
                            <div className="space-y-2">
                                <div className="text-lg font-black text-slate-900">오늘의 추천 코디</div>
                                <div className="flex flex-wrap gap-2">
                                    {contextChips.map((c, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600"
                                        >
                      {c}
                    </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {onGoRecommendation && (
                                    <Button variant="primary" onClick={onGoRecommendation}>
                                        추천 페이지로
                                    </Button>
                                )}
                                <Button variant="outline" onClick={onClose}>
                                    닫기
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <Section title="상의" items={recoList.top} onToggleFavorite={onToggleFavorite} />
                            <Section title="하의" items={recoList.bottom} onToggleFavorite={onToggleFavorite} />
                            <Section title="아우터" items={recoList.outer} onToggleFavorite={onToggleFavorite} />
                            <Section title="원피스" items={recoList.onePiece} onToggleFavorite={onToggleFavorite} />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OutfitQuickRecoModal;