// src/shared/ui/modals/OutfitQuickRecoModal.tsx
import React from "react";
import { Card, Button, Badge, cn } from "@/app/DesignSystem";
import { X, Heart } from "lucide-react";
import type { ClothingCategory } from "@/shared/domain/clothing";
import { categoryLabelKo } from "@/shared/domain/clothing";

export type OutfitRecoItem = {
    id?: number | string;
    clothingId: number;
    name: string;
    category: ClothingCategory | "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";
    imageUrl?: string | null;
    brand?: string | null;

    // optional fields used in your UI
    suitableMinTemp?: number | null;
    suitableMaxTemp?: number | null;

    // ✅ like state
    favorited?: boolean;
    inCloset?: boolean;
};

export type RecommendationClosetList = {
    top: OutfitRecoItem[];
    bottom: OutfitRecoItem[];
    outer: OutfitRecoItem[];
};

type Props = {
    open: boolean;
    onClose: () => void;
    recoList: RecommendationClosetList;
    contextChips?: string[];

    // optional CTA (keep)
    onGoRecommendation?: () => void;

    // ✅ 좋아요 토글(선택)
    onToggleFavorite?: (clothingId: number, next: boolean) => void;

    // ✅ 아이템 클릭(선택/상세) - 필요 없으면 안 넘겨도 됨
    onItemClick?: (item: OutfitRecoItem) => void;
};

const ItemCard = ({
                      it,
                      onToggleFavorite,
                      onItemClick,
                  }: {
    it: OutfitRecoItem;
    onToggleFavorite?: Props["onToggleFavorite"];
    onItemClick?: Props["onItemClick"];
}) => {
    const liked = Boolean(it.favorited);

    return (
        <button
            type="button"
            onClick={() => onItemClick?.(it)}
            className={cn(
                "relative rounded-2xl border border-slate-200 bg-white overflow-hidden text-left",
                "hover:border-slate-300 hover:shadow-sm transition",
                "focus:outline-none focus:ring-2 focus:ring-navy-900/20"
            )}
            aria-label={`${it.name} 카드`}
        >
            {/* Thumb */}
            <div className="relative aspect-square bg-slate-100 overflow-hidden">
                {it.imageUrl ? (
                    <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                        NO IMAGE
                    </div>
                )}

                {/* ✅ Like overlay (top-right) */}
                {onToggleFavorite && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavorite(it.clothingId, !liked);
                        }}
                        className={cn(
                            "absolute top-2 right-2 z-10",
                            "inline-flex items-center justify-center w-8 h-8 rounded-full",
                            "bg-white/90 backdrop-blur border border-slate-200",
                            "hover:bg-white transition"
                        )}
                        aria-label={liked ? "좋아요 해제" : "좋아요"}
                        title={liked ? "좋아요 해제" : "좋아요"}
                    >
                        <Heart
                            size={16}
                            className={cn(
                                liked ? "fill-red-500 text-red-500" : "text-slate-500"
                            )}
                        />
                    </button>
                )}
            </div>

            {/* Meta */}
            <div className="p-3 space-y-2">
                <div className="text-[11px] font-black text-slate-900 line-clamp-1">
                    {it.name}
                </div>

                <div className="flex flex-wrap gap-1">
                    <Badge variant="slate">
                        {categoryLabelKo[it.category as ClothingCategory]}
                    </Badge>

                    {typeof it.suitableMinTemp === "number" &&
                    typeof it.suitableMaxTemp === "number" ? (
                        <Badge variant="slate">{`${it.suitableMinTemp}~${it.suitableMaxTemp}°C`}</Badge>
                    ) : null}
                </div>

                {it.inCloset === false ? (
                    <div className="text-[10px] font-bold text-slate-400">미보관</div>
                ) : null}
            </div>
        </button>
    );
};

const Section: React.FC<{
    title: string;
    items: OutfitRecoItem[];
    onToggleFavorite?: Props["onToggleFavorite"];
    onItemClick?: Props["onItemClick"];
}> = ({ title, items, onToggleFavorite, onItemClick }) => {
    // ✅ 섹션은 항상 보이게(데이터 없으면 empty 상태)
    const has = Array.isArray(items) && items.length > 0;
    const padded = has ? items : [];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-black text-slate-900">{title}</div>
                <div className="text-[10px] font-black text-slate-400">
                    {has ? `${items.length}개` : "0개"}
                </div>
            </div>

            {!has ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-black text-slate-700">
                        추천 후보가 없습니다
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-slate-500 leading-5">
                        옷장 데이터가 쌓이면 자동으로 채워집니다.
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {padded.map((it) => (
                        <ItemCard
                            key={it.clothingId}
                            it={it}
                            onToggleFavorite={onToggleFavorite}
                            onItemClick={onItemClick}
                        />
                    ))}
                </div>
            )}
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
                                                   onItemClick,
                                               }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999]">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* sheet */}
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl p-4">
                <Card className="rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
                    {/* header */}
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-start justify-between gap-6">
                            <div className="space-y-2 min-w-0">
                                <div className="text-lg font-black text-slate-900">
                                    전체 코디 리스트
                                </div>
                                <div className="text-xs font-bold text-slate-500">
                                    카테고리별 3×3 후보를 빠르게 확인합니다.
                                </div>

                                {contextChips.length > 0 && (
                                    <div className="pt-2 flex flex-wrap gap-2">
                                        {contextChips.map((c, i) => (
                                            <span
                                                key={i}
                                                className="text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600"
                                            >
                        {c}
                      </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {onGoRecommendation && (
                                    <Button variant="primary" onClick={onGoRecommendation}>
                                        추천 페이지로
                                    </Button>
                                )}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
                                    aria-label="닫기"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* body */}
                    <div className="p-6 space-y-8">
                        <Section
                            title="상의"
                            items={recoList?.top ?? []}
                            onToggleFavorite={onToggleFavorite}
                            onItemClick={onItemClick}
                        />
                        <Section
                            title="하의"
                            items={recoList?.bottom ?? []}
                            onToggleFavorite={onToggleFavorite}
                            onItemClick={onItemClick}
                        />
                        <Section
                            title="아우터"
                            items={recoList?.outer ?? []}
                            onToggleFavorite={onToggleFavorite}
                            onItemClick={onItemClick}
                        />
                    </div>

                    {/* footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            닫기
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OutfitQuickRecoModal;