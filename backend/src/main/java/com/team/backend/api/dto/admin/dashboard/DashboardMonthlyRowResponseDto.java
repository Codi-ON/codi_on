// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardMonthlyRowResponseDto.java
package com.team.backend.api.dto.admin.dashboard;

import java.util.List;

public record DashboardMonthlyRowResponseDto(
        String month, // "YYYY-MM"

        long totalSessionEvents,
        long totalSessions,
        long uniqueUsers,
        double avgSessionsPerUser,

        long totalClicks,
        long totalRecoEvents,

        long errorEvents,

        long startedSessions,
        long endedSessions,
        double sessionEndRate, // 0~100

        long recoEmpty,
        long recoGenerated,
        double recoEmptyRate,  // 0~100

        List<TopClickedItem> topClickedItems // topN
) {
    public record TopClickedItem(
            int rank,
            long clothingItemId,
            String name,
            long clickCount,
            double clickRatio // 0~1
    ) {}
}