// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardOverviewMetricsDto.java
package com.team.backend.api.dto.admin.dashboard;

import java.time.LocalDate;
import java.util.List;

public final class DashboardOverviewMetricsDto {

    private DashboardOverviewMetricsDto() {}

    public record Summary(
            long totalSessionEvents,   // session_log row 수
            long totalSessions,        // distinct session_id 수
            long uniqueUsers,
            double avgSessionsPerUser,

            long totalClicks,
            long totalRecoEvents,

            long errorEvents,

            long startedSessions,
            long endedSessions,
            double sessionEndRate,     // 0~100

            long recoEmpty,
            long recoGenerated,
            double recoEmptyRate       // 0~100
    ) {}

    public record DailySessions(
            LocalDate date,
            long sessionEventCount,
            long uniqueUserCount
    ) {}

    public record DailyClicks(
            LocalDate date,
            long clickCount
    ) {}

    public record TopClickedItem(
            long itemId,
            String name,
            long clickCount
    ) {}

    public record Metrics(
            Summary summary,
            List<DailySessions> dailySessions,
            List<DailyClicks> dailyClicks,
            List<TopClickedItem> topClickedItems
    ) {}
}