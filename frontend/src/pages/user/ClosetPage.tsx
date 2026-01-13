// src/pages/user/ClosetPage.tsx
import React, { useMemo, useState } from "react";
import { SectionHeader, Card, Button, Badge, cn } from "../../app/DesignSystem";
import { AddItemModal } from "../../shared/ui/modals/AddItemModal";
import { Plus, Heart, Grid, List } from "lucide-react";

import { ClothesCategory, SeasonType } from "@/lib/api/closetApi";
import { useClothes } from "@/lib/hooks/useCloset";

const CATEGORY_TABS: Array<{ key: "ALL" | ClothesCategory; label: string }> = [
    { key: "ALL", label: "전체" },
    { key: "TOP", label: "상의" },
    { key: "BOTTOM", label: "하의" },
    { key: "OUTER", label: "아우터" },
    { key: "ONE_PIECE", label: "원피스" },
];

const SEASON_TABS: Array<{ key: "ALL" | SeasonType; label: string }> = [
    { key: "ALL", label: "전체 시즌" },
    { key: "SPRING", label: "봄" },
    { key: "SUMMER", label: "여름" },
    { key: "AUTUMN", label: "가을" },
    { key: "WINTER", label: "겨울" },
];

const ClosetPage: React.FC = () => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // ✅ 1차 필터: 카테고리 + 시즌 + 즐겨찾기
    const [category, setCategory] = useState<"ALL" | ClothesCategory>("ALL");
    const [season, setSeason] = useState<"ALL" | SeasonType>("ALL");
    const [favoritesOnly, setFavoritesOnly] = useState(false);

    // ✅ 30개 전체 로드
    const { items, loading, error, toggleFavorite } = useClothes(30);

    const filtered = useMemo(() => {
        return items
            .filter((it) => (category === "ALL" ? true : it.category === category))
            .filter((it) => (season === "ALL" ? true : (it.seasons ?? []).includes(season)))
            .filter((it) => (favoritesOnly ? it.favorited : true));
    }, [items, category, season, favoritesOnly]);

    return (
        <div className="space-y-10">
            <SectionHeader
                title="나의 컬렉션"
                subtitle="보유하신 의류 아이템을 카테고리/시즌/즐겨찾기로 관리하고 데이터 기반 스타일링에 활용하세요."
                action={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="lg" icon={Plus} onClick={() => setAddModalOpen(true)}>
                            새 아이템 등록
                        </Button>
                    </div>
                }
            />

            {/* Toolbar (슬림: 즐겨찾기(오른쪽) + 뷰 토글만) */}
            <Card className="p-2 bg-white/60 backdrop-blur-xl sticky top-20 z-20 border-slate-200 shadow-xl shadow-navy-900/5">
                <div className="flex items-center justify-end gap-2 px-3 py-2">
                    {/* 즐겨찾기: 오른쪽(뷰 토글 옆) */}
                    <button
                        onClick={() => setFavoritesOnly((v) => !v)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black border transition-all",
                            favoritesOnly
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                        title="즐겨찾기만 보기"
                    >
            <span className="inline-flex items-center gap-2">
              <Heart size={16} className={favoritesOnly ? "text-red-500" : "text-slate-400"} />
              즐겨찾기
            </span>
                    </button>

                    {/* View mode */}
                    <div className="flex bg-slate-100 p-1.5 rounded-xl">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "grid" ? "bg-white text-orange-500 shadow-sm" : "text-slate-400 hover:text-navy-900"
                            )}
                            aria-label="grid"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "list" ? "bg-white text-orange-500 shadow-sm" : "text-slate-400 hover:text-navy-900"
                            )}
                            aria-label="list"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mt-1 px-3 pb-3 overflow-x-auto no-scrollbar border-t border-slate-50 pt-3">
                    {CATEGORY_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setCategory(t.key)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border-2",
                                category === t.key
                                    ? "bg-navy-900 text-white border-navy-900 shadow-lg shadow-navy-900/20"
                                    : "bg-white text-slate-500 border-transparent hover:border-slate-100"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Season Tabs (톤 다운 + 위계 약하게) */}
                <div className="flex gap-2 px-3 pb-3 overflow-x-auto no-scrollbar">
                    {SEASON_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setSeason(t.key)}
                            className={cn(
                                "px-5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap border",
                                season === t.key
                                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </Card>

            {loading && <div className="text-sm font-bold text-slate-400">옷 목록 불러오는 중...</div>}
            {error && <div className="text-sm font-bold text-red-500">{error}</div>}

            {/* Grid/List (표시 정보 최소화: 이미지/카테고리/좋아요/이름) */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {filtered.map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                            <div className="aspect-[3/4] rounded-[36px] bg-white border border-slate-200 overflow-hidden relative mb-3 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-300">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={item.name}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100" />
                                )}

                                {/* 좋아요: hover에만 노출 (모바일은 항상 보이게 하고 싶으면 opacity 로직 제거) */}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(item.clothingId);
                                        }}
                                        className="w-11 h-11 bg-white/90 backdrop-blur-md shadow-xl rounded-2xl flex items-center justify-center text-red-500 hover:bg-white active:scale-90"
                                        title="즐겨찾기"
                                    >
                                        <Heart size={18} fill={item.favorited ? "currentColor" : "none"} />
                                    </button>
                                </div>

                                {/* 카테고리 */}
                                <div className="absolute bottom-4 left-4">
                                    <Badge variant="navy">{item.category}</Badge>
                                </div>
                            </div>

                            {/* 이름만 */}
                            <div className="px-1">
                                <h4 className="font-black text-navy-900 text-base truncate">{item.name}</h4>
                            </div>
                        </div>
                    ))}

                    {/* Add Item */}
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="aspect-[3/4] rounded-[36px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500/30 hover:bg-orange-50/40 transition-all group"
                    >
                        <Plus size={44} className="mb-3 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="font-black text-xs uppercase tracking-widest">Add Item</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((item) => (
                        <Card key={item.id} className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="navy">{item.category}</Badge>
                                                <div className="text-sm font-black text-navy-900 truncate">{item.name}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleFavorite(item.clothingId)}
                                            className="w-11 h-11 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-red-500 hover:bg-slate-50"
                                            title="즐겨찾기"
                                        >
                                            <Heart size={18} fill={item.favorited ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <AddItemModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
        </div>
    );
};

export default ClosetPage;