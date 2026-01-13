// src/lib/api/userDashboardApi.ts
import { sessionApi } from "@/lib/http";

export type UserDashboardSection =
    | "OVERVIEW"
    | "SUMMARY"
    | "FUNNEL"
    | "CATEGORY"
    | "TOP_ITEMS";

export type UserDashboardOverviewQuery = {
    year: number;
    month: number;
    section?: UserDashboardSection;
};

export type CategoryKey = "TOP" | "BOTTOM" | "OUTER" | "DRESS" | "ETC";
export type DonutBasis = "ALL_CLICKS" | "FAVORITED_CLICKS";

export type UserDashboardOverviewDto = {
    range: { from: string; to: string };

    summary: {
        monthlyOutfitCount: number;
        feedbackCount: number;
        feedbackRate: number; // 0~100

        mostUsedRecoStrategy: "BLEND_RATIO" | "MATERIAL_RATIO" | null;
        mostCommonCondition: string | null;

        avgTemp: number | null;
        avgFeelsLike: number | null;
    };

    funnel: {
        saved: number;
        feedback: number;
    };

    categoryDonut: {
        basis: DonutBasis;
        totalClicks: number;
        items: Array<{ category: CategoryKey; count: number; ratio: number }>; // ratio: 0~1
    };

    topClickedItems: Array<{
        clothingId: number;
        name: string;
        category: CategoryKey;
        count: number;
        imageUrl: string | null;
    }>;

    topFavoritedClickedItems: Array<{
        clothingId: number;
        name: string;
        category: CategoryKey;
        count: number;
        imageUrl: string | null;
    }>;
};

export const userDashboardApi = {
    /**
     * GET /api/user/dashboard/overview?section=...&year=YYYY&month=M
     * sessionApi는 이미 ApiResponse<T>를 unwrap 해서 "T만" 리턴한다.

     */
    getOverview(params: UserDashboardOverviewQuery): Promise<UserDashboardOverviewDto> {
        return sessionApi.get<UserDashboardOverviewDto>("/api/user/dashboard/overview", { params });
    },
} as const;