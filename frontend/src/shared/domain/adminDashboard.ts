// src/shared/domain/adminDashboard.ts

export type AdminDashboardOverviewQuery = {
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
    topN: number;
};

export type AdminDashboardOverviewDto = {
    meta: {
        from: string; // YYYY-MM-DD
        to: string; // YYYY-MM-DD
        generatedAt: string; // ISO
        topN: number;
    };

    metrics: {
        summary: {
            totalSessionEvents: number;
            totalSessions: number;
            uniqueUsers: number;
            avgSessionsPerUser: number;

            totalClicks: number;
            totalRecoEvents: number;
            errorEvents: number;

            startedSessions?: number;
            endedSessions?: number;

            sessionEndRate: number; // 0~100
            recoEmpty?: number;
            recoGenerated?: number;
            recoEmptyRate: number; // 0~100
            returningRate: number; // 0~100

            funnel: {
                checklistSubmitted: number;
                recoShown: number;
                itemSelected: number;
                checklistToShownRate: number; // 0~100
                shownToSelectRate: number; // 0~100
            };
        };

        dailySessions: Array<{
            date: string; // YYYY-MM-DD
            sessionEventCount: number;
            uniqueUserCount: number;
            errorEventCount?: number;
            errorRate?: number; // 0~100
        }>;

        dailyClicks: Array<{
            date: string; // YYYY-MM-DD
            clickCount: number;
        }>;

        topClickedItems: Array<{
            itemId: number;
            name: string;
            clickCount: number;
        }>;

        d1RetentionSummary?: {
            eligibleUsers: number;
            retainedUsers: number;
            d1RetentionRate: number; // 0~100
        };

        d1RetentionTrend: Array<{
            date: string; // YYYY-MM-DD (cohort day)
            baseUsers: number;
            retainedUsers: number;
            d1RetentionRate: number; // 0~100
        }>;
    };

};


export type AdminDashboardMonthlyQuery = {
    fromMonth: string; // "YYYY-MM"
    toMonth: string;   // "YYYY-MM"
    topN?: number;
};

export type AdminDashboardMonthlyDto = {
    meta: {
        region: string;
        generatedAt: string; // ISO
        timezone: string;
        topN: number;
    };
    range: {
        fromMonth: string;
        toMonth: string;
    };
    rows: Array<{
        month: string; // "YYYY-MM"
        totalSessionEvents: number;
        totalSessions: number;
        uniqueUsers: number;
        avgSessionsPerUser: number;

        totalClicks: number;
        totalRecoEvents: number;
        errorEvents: number;

        startedSessions: number;
        endedSessions: number;
        sessionEndRate: number; // 0~100

        recoEmpty: number;
        recoGenerated: number;
        recoEmptyRate: number; // 0~100

        topClickedItems: Array<{
            rank: number;
            itemId: number;
            name: string;
            clickCount: number;
            clickRatio: number; // 0~1
        }>;
    }>;

};
