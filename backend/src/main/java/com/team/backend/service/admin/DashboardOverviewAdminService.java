// src/main/java/com/team/backend/service/admin/DashboardOverviewAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewMetricsDto;
import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.repository.admin.DashboardOverviewJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardOverviewAdminService {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    private final DashboardOverviewJdbcRepository dashboardOverviewJdbcRepository;
    private final DashboardOverviewMapper dashboardOverviewMapper;

    public DashboardOverviewResponseDto getOverview(LocalDate from, LocalDate to, int topN) {

        OffsetDateTime fromAt = from.atStartOfDay().atOffset(KST);
        OffsetDateTime toAt   = to.plusDays(1).atStartOfDay().atOffset(KST); // [fromAt, toAt)

        var summary       = dashboardOverviewJdbcRepository.findSummary(fromAt, toAt);
        var dailySessions = dashboardOverviewJdbcRepository.findDailySessions(fromAt, toAt);
        var dailyClicks   = dashboardOverviewJdbcRepository.findDailyClicks(fromAt, toAt);
        var topClicked    = dashboardOverviewJdbcRepository.findTopClickedItems(fromAt, toAt, topN);

        var metrics = new DashboardOverviewMetricsDto.Metrics(
                summary,
                dailySessions,
                dailyClicks,
                topClicked
        );

        return dashboardOverviewMapper.toResponse(fromAt, toAt, "Asia/Seoul", metrics);
    }
}
