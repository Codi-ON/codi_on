// src/main/java/com/team/backend/service/admin/DashboardOverviewAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewMetricsDto;
import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.repository.admin.DashboardOverviewJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardOverviewAdminService {

    private final DashboardOverviewJdbcRepository dashboardOverviewJdbcRepository;
    private final DashboardOverviewMapper dashboardOverviewMapper;

    public DashboardOverviewResponseDto getOverview(LocalDate from, LocalDate to, int topN) {
        TimeRanges.Range r = TimeRanges.kstDayRange(from, to);

        var summary       = dashboardOverviewJdbcRepository.findSummary(r.fromInclusive(), r.toExclusive());
        var dailySessions = dashboardOverviewJdbcRepository.findDailySessions(r.fromInclusive(), r.toExclusive());
        var dailyClicks   = dashboardOverviewJdbcRepository.findDailyClicks(r.fromInclusive(), r.toExclusive());
        var topClicked    = dashboardOverviewJdbcRepository.findTopClickedItems(r.fromInclusive(), r.toExclusive(), topN);

        var metrics = new DashboardOverviewMetricsDto.Metrics(
                summary,
                dailySessions,
                dailyClicks,
                topClicked
        );

        return dashboardOverviewMapper.toResponse(
                r.fromInclusive(),
                r.toExclusive(),
                TimeRanges.timezone(),
                metrics
        );
    }
}