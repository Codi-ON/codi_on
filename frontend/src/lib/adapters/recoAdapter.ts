// src/lib/adapters/recoAdapter.ts

export type ClosetItem = {
    id: number;          // 화면 key용(= clothingId로 고정)
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

// ✅ candidates / today 공통 최소 스펙
export type BaseRecoItem = {
    clothingId: number;
    name: string;
    imageUrl?: string | null;
    inCloset?: boolean;
};

export function toClosetList(items: BaseRecoItem[], label: ClosetItem["label"]): ClosetItem[] {
    return (items ?? [])
        .filter((x) => x && typeof x.clothingId === "number" && typeof x.name === "string")
        .map((x) => ({
            id: x.clothingId,
            clothingId: x.clothingId,
            label,
            name: x.name,
            imageUrl: x.imageUrl ?? undefined,
            inCloset: x.inCloset ?? true,
        }));
}

/**
 * ✅ 점수순 정렬된 배열에서 3개만 고르는 정책
 * - 길이 >= 7 : 1,5,7 (0,4,6)
 * - 그 외     : 1,3,5 (0,2,4)
 * - 그리고 clothingId 기준 중복 제거
 */
export function pickTop3ByRank<T>(
    sorted: T[],
    getKey: (x: T) => number | string
): T[] {
    if (!Array.isArray(sorted) || sorted.length === 0) return [];

    const primary = [0, 4, 6];   // 1,5,7
    const fallback = [0, 2, 4];  // 1,3,5
    const indices = sorted.length >= 7 ? primary : fallback;

    const picked = indices
        .filter((i) => i >= 0 && i < sorted.length)
        .map((i) => sorted[i]);

    // ✅ key 기반 dedupe (Set으로 객체 dedupe 하면 실패함)
    const seen = new Set<number | string>();
    const out: T[] = [];
    for (const item of picked) {
        const k = getKey(item);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(item);
    }

    // 최소 1개는 보장
    return out.length ? out : [sorted[0]];
}