// src/main/java/com/team/backend/service/admin/DashboardOverviewAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.api.dto.click.DashboardClicksResponse;
import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import com.team.backend.service.click.DashboardClicksService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardOverviewAdminService {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    private final SessionMetricsAdminService sessionMetricsAdminService;
    private final DashboardClicksService dashboardClicksService;

    public DashboardOverviewResponseDto getOverview(LocalDate from, LocalDate to, int topN) {
        OffsetDateTime fromAt = from.atStartOfDay().atOffset(KST);
        OffsetDateTime toAt = to.plusDays(1).atStartOfDay().atOffset(KST).minusNanos(1);

        SessionMetricsDashboardResponseDto sessions =
                sessionMetricsAdminService.getDashboard(fromAt, toAt);

        DashboardClicksResponse clicks =
                dashboardClicksService.getDashboardClicks(from, to, topN);

        return DashboardOverviewResponseDto.builder()
                .meta(DashboardOverviewResponseDto.Meta.builder()
                        .generatedAt(OffsetDateTime.now(KST))
                        .timezone("+09:00")
                        .build())
                .sessions(sessions)
                .clicks(clicks)
                .build();
    }
}