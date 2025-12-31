import {ClothesCategory, SeasonType} from "@/lib/api/closetApi.ts";

export type ClothingCategory = "TOP" | "BOTTOM" | "OUTER" | "ONE_PIECE";

export const categoryLabelKo: Record<ClothingCategory, string> = {
    TOP: "상의",
    BOTTOM: "하의",
    OUTER: "아우터",
    ONE_PIECE: "원피스",
};
export type ClothingItem = {
    id: number;
    clothingId: number;

    name: string;
    category: ClothesCategory;

    thicknessLevel: string;
    usageType: string;
    seasons: SeasonType[];

    suitableMinTemp: number;
    suitableMaxTemp: number;

    cottonPercentage: number | null;
    polyesterPercentage: number | null;
    etcFiberPercentage: number | null;

    color: string | null;
    styleTag: string | null;
    imageUrl: string | null;

    selectedCount: number;
    favorited: boolean;
};