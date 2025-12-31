import React, { useMemo, useState } from "react";
import { SectionHeader, Card, Button, Badge, cn } from "../../app/DesignSystem";
import { AddItemModal } from "../../shared/ui/modals/AddItemModal";
import {
    Search,
    Plus,
    Heart,
    Grid,
    List,
    SlidersHorizontal,
    ArrowUpDown,
} from "lucide-react";
import {ClothesCategory, SeasonType} from "@/lib/api/closetApi.ts";
import {ClothingItem} from "@/shared/domain/clothing.ts";
import {useClothes} from "@/lib/hooks/useCloset.ts";



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

function matchesSearch(item: ClothingItem, q: string) {
    if (!q) return true;
    const s = q.trim().toLowerCase();
    if (!s) return true;

    const fields = [
        item.name,
        item.color ?? "",
        item.styleTag ?? "",
    ].join(" ").toLowerCase();

    return fields.includes(s);
}

const ClosetPage: React.FC = () => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // ✅ 1차 필터: 카테고리 + 시즌 + 즐겨찾기
    const [category, setCategory] = useState<"ALL" | ClothesCategory>("ALL");
    const [season, setSeason] = useState<"ALL" | SeasonType>("ALL");
    const [favoritesOnly, setFavoritesOnly] = useState(false);

    // ✅ 검색
    const [q, setQ] = useState("");

    // ✅ 30개 전체 로드
    const { items, loading, error, refresh, toggleFavorite } = useClothes(30);

    const filtered = useMemo(() => {
        return items
            .filter((it) => (category === "ALL" ? true : it.category === category))
            .filter((it) => (season === "ALL" ? true : (it.seasons ?? []).includes(season)))
            .filter((it) => (favoritesOnly ? it.favorited : true))
            .filter((it) => matchesSearch(it, q));
    }, [items, category, season, favoritesOnly, q]);

    return (
        <div className="space-y-10">
            <SectionHeader
                title="나의 컬렉션"
                subtitle="보유하신 의류 아이템을 카테고리/시즌/즐겨찾기로 관리하고 데이터 기반 스타일링에 활용하세요."
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" size="lg" onClick={refresh} disabled={loading}>
                            새로고침
                        </Button>
                        <Button variant="secondary" size="lg" icon={Plus} onClick={() => setAddModalOpen(true)}>
                            새 아이템 등록
                        </Button>
                    </div>
                }
            />

            {/* Toolbar */}
            <Card className="p-2 bg-white/60 backdrop-blur-xl sticky top-20 z-20 border-slate-200 shadow-xl shadow-navy-900/5">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                            size={20}
                        />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            type="text"
                            placeholder="이름(필수) + (있으면) 스타일태그/색상 검색"
                            className="w-full pl-14 pr-6 py-4 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-400"
                        />
                    </div>

                    <div className="h-px lg:h-12 w-full lg:w-px bg-slate-100"></div>

                    <div className="flex items-center gap-2 px-2">
                        <Button variant="ghost" size="sm" icon={SlidersHorizontal}>
                            상세 필터(2차)
                        </Button>
                        <Button variant="ghost" size="sm" icon={ArrowUpDown}>
                            정렬(추후)
                        </Button>

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

                        <div className="flex bg-slate-100 p-1.5 rounded-xl ml-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    viewMode === "grid"
                                        ? "bg-white text-orange-500 shadow-sm"
                                        : "text-slate-400 hover:text-navy-900"
                                )}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    viewMode === "list"
                                        ? "bg-white text-orange-500 shadow-sm"
                                        : "text-slate-400 hover:text-navy-900"
                                )}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mt-2 px-3 pb-3 overflow-x-auto no-scrollbar border-t border-slate-50 pt-3">
                    {CATEGORY_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setCategory(t.key)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border-2",
                                category === t.key
                                    ? "bg-navy-900 text-white border-navy-900 shadow-lg shadow-navy-900/20"
                                    : "bg-white text-slate-400 border-transparent hover:border-slate-100"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Season Tabs */}
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

            {/* Grid/List */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {filtered.map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                            <div className="aspect-[3/4] rounded-[40px] bg-white border border-slate-200 overflow-hidden relative mb-4 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        alt={item.name}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100" />
                                )}

                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(item.clothingId);
                                        }}
                                        className="w-12 h-12 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl flex items-center justify-center text-red-500 hover:bg-white active:scale-90"
                                        title="즐겨찾기"
                                    >
                                        <Heart size={20} fill={item.favorited ? "currentColor" : "none"} />
                                    </button>
                                </div>

                                <div className="absolute bottom-6 left-6">
                                    <Badge variant="navy">{item.category}</Badge>
                                </div>
                            </div>

                            <div className="px-2">
                                <div className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">
                                    {item.styleTag ?? "—"}
                                </div>
                                <h4 className="font-black text-navy-900 text-lg truncate mb-1">{item.name}</h4>
                                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">
                    {(item.color ?? "—")} · {(item.seasons?.[0] ?? "—")}
                  </span>
                                    <span className="text-[10px] font-black text-slate-800">POP {item.selectedCount}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="aspect-[3/4] rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:text-orange-500 hover:border-orange-500/20 hover:bg-orange-50/50 transition-all group"
                    >
                        <Plus size={48} className="mb-4 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="font-black text-sm uppercase tracking-widest">Add Item</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
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
                                            <div className="text-sm font-black text-navy-900 truncate">{item.name}</div>
                                            <div className="text-xs text-slate-500 font-bold mt-1">
                                                {item.category} · {item.seasons?.join(", ") || "—"} · {item.color ?? "—"}
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

                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge variant="slate">POP {item.selectedCount}</Badge>
                                        {item.styleTag && <Badge variant="orange">{item.styleTag}</Badge>}
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