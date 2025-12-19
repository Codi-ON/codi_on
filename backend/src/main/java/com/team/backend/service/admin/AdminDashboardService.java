package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewMetricsDto;
import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.repository.admin.DashboardOverviewJdbcRepository;
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
public class AdminDashboardService {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);
    private static final String TIMEZONE_LABEL = "Asia/Seoul";

    private final DashboardOverviewJdbcRepository dashboardOverviewJdbcRepository;
    private final DashboardOverviewMapper dashboardOverviewMapper;

    public DashboardOverviewResponseDto overview(LocalDate from, LocalDate to, int topN) {

        // 기간 정책: [from 00:00 KST, (to+1) 00:00 KST)  (to는 inclusive처럼 쓰고 실제 조회는 exclusive)
        OffsetDateTime fromTs = from.atStartOfDay().atOffset(KST);
        OffsetDateTime toTs = to.plusDays(1).atStartOfDay().atOffset(KST);

        DashboardOverviewMetricsDto.Summary summary =
                dashboardOverviewJdbcRepository.findSummary(fromTs, toTs);

        List<DashboardOverviewMetricsDto.DailySessions> dailySessions =
                dashboardOverviewJdbcRepository.findDailySessions(fromTs, toTs);

        List<DashboardOverviewMetricsDto.DailyClicks> dailyClicks =
                dashboardOverviewJdbcRepository.findDailyClicks(fromTs, toTs);

        List<DashboardOverviewMetricsDto.TopClickedItem> topClickedItems =
                dashboardOverviewJdbcRepository.findTopClickedItems(fromTs, toTs, topN);

        DashboardOverviewMetricsDto.Metrics metrics =
                DashboardOverviewMetricsDto.Metrics.builder()
                        .summary(summary)
                        .dailySessions(dailySessions)
                        .dailyClicks(dailyClicks)
                        .topClickedItems(topClickedItems)
                        .build();

        return dashboardOverviewMapper.toResponse(fromTs, toTs, TIMEZONE_LABEL, metrics);
    }
}