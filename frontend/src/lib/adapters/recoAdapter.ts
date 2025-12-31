// src/lib/adapters/recoAdapter.ts
import type { RecommendTodayItemDto } from "@/lib/repo/recoRepo";

export type ClosetItem = {
    id: number;          // 화면 key용(= clothingId로 고정 추천)
    clothingId: number;  // 저장용
    label: "상의" | "하의" | "아우터";
    name: string;
    imageUrl?: string;
    inCloset?: boolean;
};

export type RecommendationClosetList = {
    top: ClosetItem[];
    bottom: ClosetItem[];
    outer: ClosetItem[];
};

export function toClosetList(items: RecommendTodayItemDto[], label: ClosetItem["label"]): ClosetItem[] {
    return items.map((x) => ({
        id: x.clothingId,
        clothingId: x.clothingId,
        label,
        name: x.name,
        imageUrl: x.imageUrl ?? undefined,
        inCloset: true,
    }));
}