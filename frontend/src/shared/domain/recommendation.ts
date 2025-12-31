export type RecommendCategory = "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";

export type OutfitRecoItem = {
    id: number;
    clothingId: number;
    name: string;
    category: RecommendCategory;
    imageUrl: string | null;

    thicknessLevel: string;
    usageType: string;
    seasons: string[];

    suitableMinTemp: number;
    suitableMaxTemp: number;

    cottonPercentage: number | null;
    polyesterPercentage: number | null;
    etcFiberPercentage: number | null;

    color: string;
    styleTag: string;

    selectedCount: number;
    favorited: boolean;
};

export type RecommendationClosetList = {
    top: OutfitRecoItem[];
    bottom: OutfitRecoItem[];
    outer: OutfitRecoItem[];
    onePiece: OutfitRecoItem[];
};