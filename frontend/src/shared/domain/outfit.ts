export type TodayOutfitItem = {
    clothingId: number;
    sortOrder: number;
    name?: string;
    imageUrl?: string;
    category?: string;
};

export type TodayOutfit = {
    date?: string;
    items: TodayOutfitItem[];
};