// src/main/java/com/team/backend/service/admin/SessionMetricsAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.session.*;
import com.team.backend.repository.log.SessionLogMetricsJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionMetricsAdminService {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    private final SessionLogMetricsJdbcRepository sessionLogMetricsJdbcRepository;

    public SessionMetricsDashboardResponseDto getDashboard(LocalDate from, LocalDate to) {
        OffsetDateTime fromAt = from.atStartOfDay().atOffset(KST);
        OffsetDateTime toAt = to.plusDays(1).atStartOfDay().atOffset(KST).minusNanos(1);

        SessionMetricsSummaryResponseDto summary =
                sessionLogMetricsJdbcRepository.findSummary(fromAt, toAt);

        List<SessionDailyTrendResponseDto> dailyTrend =
                sessionLogMetricsJdbcRepository.findDailyTrend(fromAt, toAt);

        List<SessionHourlyUsageResponseDto> hourlyUsage =
                sessionLogMetricsJdbcRepository.findHourlyUsage(fromAt, toAt);

        return SessionMetricsDashboardResponseDto.builder()
                .summary(summary)
                .dailyTrend(dailyTrend)
                .hourlyUsage(hourlyUsage)
                .build();
    }
}