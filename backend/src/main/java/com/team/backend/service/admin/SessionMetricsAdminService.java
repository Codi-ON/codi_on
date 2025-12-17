// src/main/java/com/team/backend/service/SessionMetricsAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.session.SessionHourlyUsageResponseDto;
import com.team.backend.api.dto.session.SessionDailyTrendResponseDto;

import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import com.team.backend.api.dto.session.SessionMetricsSummaryResponseDto;
import com.team.backend.repository.log.SessionLogMetricsJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionMetricsAdminService {

    private final SessionLogMetricsJdbcRepository sessionLogMetricsJdbcRepository;

    /**
     * 관리자 대시보드용 세션 지표 전체 조회
     *  - 요약 + 일별 추이 + 시간대별 사용량
     */
    public SessionMetricsDashboardResponseDto getDashboard(OffsetDateTime from, OffsetDateTime to) {

        SessionMetricsSummaryResponseDto summary =
                sessionLogMetricsJdbcRepository.findSummary(from, to);

        List<SessionDailyTrendResponseDto> dailyTrend =
                sessionLogMetricsJdbcRepository.findDailyTrend(from, to);

        List<SessionHourlyUsageResponseDto> hourlyUsage =
                sessionLogMetricsJdbcRepository.findHourlyUsage(from, to);

        return SessionMetricsDashboardResponseDto.builder()
                .summary(summary)
                .dailyTrend(dailyTrend)
                .hourlyUsage(hourlyUsage)
                .build();
    }
}