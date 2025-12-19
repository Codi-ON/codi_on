// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardOverviewMetricsDto.java
package com.team.backend.api.dto.admin.dashboard;

import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

public class DashboardOverviewMetricsDto {

    private DashboardOverviewMetricsDto() {}

    @Builder
    public record Summary(
            // session_log row count = 이벤트 총량
            long totalSessionEvents,

            // distinct session_id = 세션 수 (아직 세션 테이블 없으니 이게 최선)
            long totalSessions,

            long uniqueUsers,
            double avgSessionsPerUser,

            long totalClicks,
            long totalRecoEvents,

            // KPI
            long errorEvents,

            long startedSessions,
            long endedSessions,
            double sessionEndRate,   // 0~100 (%)

            long recoEmpty,
            long recoGenerated,
            double recoEmptyRate     // 0~100 (%)
    ) {}

    @Builder
    public record DailySessions(
            LocalDate date,
            long sessionCount,       // distinct session_id
            long uniqueUserCount
    ) {}

    @Builder
    public record DailyClicks(
            LocalDate date,
            long clickCount
    ) {}

    @Builder
    public record TopClickedItem(
            long itemId,
            String name,
            long clickCount
    ) {}

    @Builder
    public record Metrics(
            Summary summary,
            List<DailySessions> dailySessions,
            List<DailyClicks> dailyClicks,
            List<TopClickedItem> topClickedItems
    ) {}
}