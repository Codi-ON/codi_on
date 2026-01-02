// src/main/java/com/team/backend/service/admin/AdminDashboardService.java
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
public class AdminDashboardService {

    private static final String TIMEZONE_LABEL = "Asia/Seoul";

    private final DashboardOverviewJdbcRepository dashboardOverviewJdbcRepository;
    private final DashboardOverviewMapper dashboardOverviewMapper;

    public DashboardOverviewResponseDto overview(LocalDate from, LocalDate to, int topN) {
        // date-only 범위 정규화 (KST, [from 00:00, to+1 00:00))
        TimeRanges.Range r = TimeRanges.kstDayRange(from, to);

        var summary = dashboardOverviewJdbcRepository.findSummary(r.fromInclusive(), r.toExclusive());
        var dailySessions = dashboardOverviewJdbcRepository.findDailySessions(r.fromInclusive(), r.toExclusive());
        var dailyClicks = dashboardOverviewJdbcRepository.findDailyClicks(r.fromInclusive(), r.toExclusive());
        var topClickedItems = dashboardOverviewJdbcRepository.findTopClickedItems(r.fromInclusive(), r.toExclusive(), topN);

        // ✅ builder() 삭제 → record 생성자 사용
        DashboardOverviewMetricsDto.Metrics metrics =
                new DashboardOverviewMetricsDto.Metrics(
                        summary,
                        dailySessions,
                        dailyClicks,
                        topClickedItems
                );

        return dashboardOverviewMapper.toResponse(r.fromInclusive(), r.toExclusive(), TIMEZONE_LABEL, metrics);
    }
}