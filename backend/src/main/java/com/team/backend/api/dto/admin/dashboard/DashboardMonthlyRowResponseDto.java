// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardMonthlyRowResponseDto.java
package com.team.backend.api.dto.admin.dashboard;

import java.util.List;

public record DashboardMonthlyRowResponseDto(
        String month,

        long totalSessionEvents,
        long totalSessions,
        long uniqueUsers,
        double avgSessionsPerUser,

        long totalClicks,
        long totalRecoEvents,

        long errorEvents,

        long startedSessions,
        long endedSessions,
        double sessionEndRate,

        long recoEmpty,
        long recoGenerated,
        double recoEmptyRate,

        Funnel funnel,

        List<TopClickedItem> topClickedItems
) {
    public record Funnel(
            long checklistSubmitted,
            long recoShown,
            long feedbackRequested,
            long itemSelected,

            double checklistToShownRate,
            double shownToFeedbackRate,
            double checklistToFeedbackRate,
            double shownToSelectRate
    ) {}

    public record TopClickedItem(
            int rank,
            long itemId,
            String name,
            long clickCount,
            double clickRatio
    ) {}
}