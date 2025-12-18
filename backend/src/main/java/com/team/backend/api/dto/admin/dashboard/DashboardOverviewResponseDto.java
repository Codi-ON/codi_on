// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardOverviewResponseDto.java
package com.team.backend.api.dto.admin.dashboard;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record DashboardOverviewResponseDto(
        Meta meta,
        Range range,
        Map<String, Section> sections
) {
    public record Meta(
            OffsetDateTime generatedAt,
            String timezone
    ) {}

    public record Range(
            OffsetDateTime from,
            OffsetDateTime to
    ) {}

    public record Section(
            String title,
            List<Card> cards,
            List<Chart> charts,
            List<Table> tables
    ) {}

    public record Card(
            String key,
            String label,
            Number value,
            String unit
    ) {}

    public record Chart(
            String key,
            String title,
            String xUnit,
            String yUnit,
            List<Series> series
    ) {}

    public record Series(
            String name,
            List<Point> points
    ) {}

    public record Point(
            String x,
            Number y
    ) {}

    public record Table(
            String key,
            String title,
            List<String> columns,
            List<Map<String, Object>> rows
    ) {}
}