package com.team.backend.service.admin;

import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import com.team.backend.repository.admin.SessionLogMetricsJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionMetricsAdminService {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    private final SessionLogMetricsJdbcRepository sessionLogMetricsJdbcRepository;

    public SessionMetricsDashboardResponseDto getDashboard(OffsetDateTime from, OffsetDateTime to) {

        // date-only 범위로 정규화 (KST)
        OffsetDateTime fromAt = from.toLocalDate().atStartOfDay().atOffset(KST);
        OffsetDateTime toAt = to.toLocalDate().plusDays(1).atStartOfDay().atOffset(KST).minusNanos(1);

        SessionMetricsDashboardResponseDto.Summary summary =
                sessionLogMetricsJdbcRepository.findSummary(fromAt, toAt);

        List<SessionMetricsDashboardResponseDto.DailyTrendItem> dailyTrend =
                sessionLogMetricsJdbcRepository.findDailyTrend(fromAt, toAt);

        List<SessionMetricsDashboardResponseDto.HourlyUsageItem> hourlyUsage =
                sessionLogMetricsJdbcRepository.findHourlyUsage(fromAt, toAt);

        return SessionMetricsDashboardResponseDto.builder()
                .summary(summary)
                .dailyTrend(dailyTrend)
                .hourlyUsage(hourlyUsage)
                .build();
    }
        private void validateRange(OffsetDateTime from, OffsetDateTime to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("from/to는 필수입니다.");
        }
        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("from은 to보다 과거여야 합니다.");
        }
    }
}