package com.team.backend.api.dto.session;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionMetricsDashboardResponseDto {

    private Summary summary;
    private List<DailyTrendItem> dailyTrend;
    private List<HourlyUsageItem> hourlyUsage;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private long totalSessions;
        private long uniqueUsers;
        private BigDecimal avgSessionsPerUser;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyTrendItem {
        private LocalDate date;
        private long sessionCount;
        private long uniqueUserCount;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlyUsageItem {
        private int hour;
        private long sessionCount;
    }
}