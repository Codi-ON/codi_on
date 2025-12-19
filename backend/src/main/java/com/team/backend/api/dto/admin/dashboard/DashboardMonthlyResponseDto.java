// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardMonthlyResponseDto.java
package com.team.backend.api.dto.admin.dashboard;

import java.time.OffsetDateTime;
import java.util.List;

public record DashboardMonthlyResponseDto(
        Meta meta,
        Range range,
        List<DashboardMonthlyRowResponseDto> rows
) {
    public record Meta(
            String region,
            OffsetDateTime generatedAt,
            String timezone,
            int topN
    ) {}

    /** month range (inclusive): "YYYY-MM" */
    public record Range(
            String fromMonth,
            String toMonth
    ) {}
}