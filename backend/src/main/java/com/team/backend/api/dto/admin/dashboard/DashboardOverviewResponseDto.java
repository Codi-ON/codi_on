// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardOverviewResponseDto.java
package com.team.backend.api.dto.admin.dashboard;

import com.team.backend.api.dto.click.DashboardClicksResponse;
import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
public class DashboardOverviewResponseDto {

    private Meta meta;
    private SessionMetricsDashboardResponseDto sessions;
    private DashboardClicksResponse clicks;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Meta {
        private OffsetDateTime generatedAt;
        private String timezone; // "Asia/Seoul" or "+09:00"
    }
}