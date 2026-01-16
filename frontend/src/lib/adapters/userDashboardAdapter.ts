// src/lib/adapters/userDashboardAdapter.ts
// 목적: 서버 DashboardOverview DTO를 "UI에서 바로 그릴 수 있는 형태"로 정규화
// 핵심: 0 값은 그대로 표시 / null만 "-" 처리(표시는 페이지에서)

// ---------- Types (API DTO) ----------
export type DashboardCategory = "TOP" | "BOTTOM" | "OUTER" | "DRESS" | "ETC";

export type DashboardOverviewDto = {
    range: { from: string; to: string };
    summary: {
        monthlyOutfitCount: number;
        feedbackCount: number;
        feedbackRate: number; // 0~100
        mostUsedRecoStrategy: string | null;
        mostCommonCondition: string | null;
        avgTemp: number | null;
        avgFeelsLike: number | null;
    };
    funnel: { saved: number; feedback: number };
    categoryDonut: {
        basis: "ALL_CLICKS" | "FAVORITED_CLICKS";
        totalClicks: number;
        items: Array<{ category: DashboardCategory; count: number; ratio: number }>;
    };
    topClickedItems: Array<{
        clothingId: number;
        name: string | null;
        category: DashboardCategory | null;
        count: number;
        imageUrl: string | null;
    }>;
    topFavoritedClickedItems: Array<{
        clothingId: number;
        name: string | null;
        category: DashboardCategory | null;
        count: number;
        imageUrl: string | null;
    }>;
};

// ---------- Types (UI Model) ----------
export type DonutDatum = {
    category: DashboardCategory;
    name: string;
    value: number; // count
    ratioRaw: number; // 0~1
    ratio: number; // 0~1 rounded(4)
};

export type TopItemUI = {
    clothingId: number;
    name: string;
    category: DashboardCategory;
    count: number;
    imageUrl: string | null;
};

export type DashboardOverviewUI = {
    range: { from: string; to: string };
    summary: {
        monthlyOutfitCount: number;
        feedbackCount: number;
        feedbackRate: number;
        mostUsedRecoStrategy: string | null;
        mostCommonCondition: string | null;
        avgTemp: number | null;
        avgFeelsLike: number | null;
    };
    funnel: { saved: number; feedback: number };
    donut: {
        basis: "ALL_CLICKS" | "FAVORITED_CLICKS";
        totalClicks: number;
        data: DonutDatum[];
    };
    topClickedItems: TopItemUI[];
    topFavoritedClickedItems: TopItemUI[];
};

// ---------- Utils ----------
export function roundTo(v: number, digits: number) {
    const p = Math.pow(10, digits);
    return Math.round(v * p) / p;
}

export function ratioToPercentText(ratio01: number | null | undefined) {
    if (typeof ratio01 !== "number" || !Number.isFinite(ratio01)) return "-";
    return `${Math.round(ratio01 * 100)}%`;
}

export function safeNumber(v: unknown, fallback = 0) {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function safeString(v: unknown, fallback = "") {
    return typeof v === "string" ? v : fallback;
}

export function safeNullableNumber(v: unknown): number | null {
    // ✅ 0은 number로 통과 (null/undefined/NaN만 null)
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function safeNullableString(v: unknown): string | null {
    return typeof v === "string" ? v : null;
}

function normalizeCategory(v: unknown): DashboardCategory {
    switch (v) {
        case "TOP":
        case "BOTTOM":
        case "OUTER":
        case "DRESS":
        case "ETC":
            return v;
        default:
            return "ETC";
    }
}

export function categoryLabel(c: DashboardCategory | null | undefined): string {
    switch (c) {
        case "TOP":
            return "상의";
        case "BOTTOM":
            return "하의";
        case "OUTER":
            return "아우터";
        case "DRESS":
            return "원피스";
        default:
            return "기타";
    }
}

/**
 * 서버/클라 계약이 흔들릴 때를 대비:
 * - dto 그대로 오거나
 * - { data: dto }로 오거나
 * 둘 다 흡수
 */
function unwrapOverviewDto(input: unknown): any {
    if (!input || typeof input !== "object") return {};
    const obj = input as any;
    if ("range" in obj && "summary" in obj) return obj;
    if ("data" in obj && obj.data && typeof obj.data === "object") return obj.data;
    return obj;
}

function normalizeTopItems(arr: unknown): TopItemUI[] {
    const list = Array.isArray(arr) ? arr : [];
    return list
        .filter((x) => x && typeof x === "object")
        .map((x: any) => {
            const category = normalizeCategory(x.category);
            return {
                clothingId: safeNumber(x.clothingId, 0),
                name: typeof x.name === "string" && x.name.trim() ? x.name : "-",
                category,
                count: safeNumber(x.count, 0),
                imageUrl: typeof x.imageUrl === "string" ? x.imageUrl : null,
            };
        })
        .filter((x) => x.clothingId > 0);
}

function normalizeDonut(dto: any): DashboardOverviewUI["donut"] {
    const basis = dto?.basis === "FAVORITED_CLICKS" ? "FAVORITED_CLICKS" : "ALL_CLICKS";
    const totalClicks = safeNumber(dto?.totalClicks, 0);
    const items = Array.isArray(dto?.items) ? dto.items : [];

    const data: DonutDatum[] = items
        .filter((x: any) => x && typeof x.count === "number" && Number.isFinite(x.count))
        .map((x: any) => {
            const category = normalizeCategory(x.category);
            const ratioRaw = typeof x.ratio === "number" && Number.isFinite(x.ratio) ? x.ratio : 0;
            return {
                category,
                name: categoryLabel(category),
                value: safeNumber(x.count, 0),
                ratioRaw,
                ratio: roundTo(ratioRaw, 4),
            };
        });

    return { basis, totalClicks, data };
}

// ---------- Adapter ----------
export const userDashboardAdapter = {
    toOverviewUI(input: DashboardOverviewDto): DashboardOverviewUI {
        const dto = unwrapOverviewDto(input);

        const range = {
            from: safeString(dto?.range?.from, "1970-01-01"),
            to: safeString(dto?.range?.to, "1970-01-01"),
        };

        const summary = {
            monthlyOutfitCount: safeNumber(dto?.summary?.monthlyOutfitCount, 0),
            feedbackCount: safeNumber(dto?.summary?.feedbackCount, 0),
            feedbackRate: safeNumber(dto?.summary?.feedbackRate, 0),
            mostUsedRecoStrategy: safeNullableString(dto?.summary?.mostUsedRecoStrategy),
            mostCommonCondition: safeNullableString(dto?.summary?.mostCommonCondition),
            avgTemp: safeNullableNumber(dto?.summary?.avgTemp),
            avgFeelsLike: safeNullableNumber(dto?.summary?.avgFeelsLike),
        };

        const funnel = {
            saved: safeNumber(dto?.funnel?.saved, 0),
            feedback: safeNumber(dto?.funnel?.feedback, 0),
        };

        return {
            range,
            summary,
            funnel,
            donut: normalizeDonut(dto?.categoryDonut),
            topClickedItems: normalizeTopItems(dto?.topClickedItems),
            topFavoritedClickedItems: normalizeTopItems(dto?.topFavoritedClickedItems),
        };
    },
} as const;