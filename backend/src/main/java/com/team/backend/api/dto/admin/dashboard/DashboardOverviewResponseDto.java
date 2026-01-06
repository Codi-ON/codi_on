// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardOverviewResponseDto.java
package com.team.backend.api.dto.admin.dashboard;

import com.team.backend.repository.admin.DashboardOverviewJdbcRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record DashboardOverviewResponseDto(
        Meta meta,
        Metrics metrics
) {

    public record Meta(
            LocalDate from,
            LocalDate to,
            Instant generatedAt
    ) {}

    public record Funnel(
            long checklistSubmitted,
            long recoShown,
            long itemSelected,
            double checklistToShownRate,  // 0~100
            double shownToSelectRate      // 0~100
    ) {}

    public record Summary(
            long totalSessionEvents,
            long totalSessions,
            long uniqueUsers,
            double avgSessionsPerUser,

            long totalClicks,
            long totalRecoEvents,

            long errorEvents,

            long startedSessions,
            long endedSessions,
            double sessionEndRate,      // 0~100

            long recoEmpty,
            long recoGenerated,
            double recoEmptyRate,       // 0~100

            double returningRate,       // 0~100 (기간 내 재방문율)
            Funnel funnel               // 퍼널 전환
    ) {}

    public record DailySessions(
            LocalDate date,
            long sessionEventCount,
            long uniqueUserCount,
            long errorEventCount,
            double errorRate            // 0~100
    ) {}

    public record DailyClicks(
            LocalDate date,
            long clickCount
    ) {}

    public record TopClickedItem(
            long itemId,
            String name,
            long clickCount
    ) {}

    public record Metrics(
            Summary summary,
            List<DailySessions> dailySessions,
            List<DailyClicks> dailyClicks,
            List<TopClickedItem> topClickedItems
    ) {}

    public static DashboardOverviewResponseDto from(
            LocalDate from,
            LocalDate to,
            int topN,
            DashboardOverviewJdbcRepository.SummaryRow summaryRow,
            List<DashboardOverviewJdbcRepository.DailySessionRow> dailySessionsRow,
            List<DashboardOverviewJdbcRepository.DailyClickRow> dailyClicksRow,
            List<DashboardOverviewJdbcRepository.TopClickedItemRow> topClickedRow
    ) {
        var funnel = new Funnel(
                summaryRow.getFunnel().getChecklistSubmitted(),
                summaryRow.getFunnel().getRecoShown(),
                summaryRow.getFunnel().getItemSelected(),
                summaryRow.getFunnel().getChecklistToShownRate(),
                summaryRow.getFunnel().getShownToSelectRate()
        );

        var summary = new Summary(
                summaryRow.getTotalSessionEvents(),
                summaryRow.getTotalSessions(),
                summaryRow.getUniqueUsers(),
                summaryRow.getAvgSessionsPerUser(),

                summaryRow.getTotalClicks(),
                summaryRow.getTotalRecoEvents(),

                summaryRow.getErrorEvents(),

                summaryRow.getStartedSessions(),
                summaryRow.getEndedSessions(),
                summaryRow.getSessionEndRate(),

                summaryRow.getRecoEmpty(),
                summaryRow.getRecoGenerated(),
                summaryRow.getRecoEmptyRate(),

                summaryRow.getReturningRate(),
                funnel
        );

        var dailySessions = dailySessionsRow.stream()
                .map(r -> new DailySessions(
                        r.getDate(),
                        r.getSessionEventCount(),
                        r.getUniqueUserCount(),
                        r.getErrorEventCount(),
                        r.getErrorRate()
                ))
                .toList();

        var dailyClicks = dailyClicksRow.stream()
                .map(r -> new DailyClicks(r.getDate(), r.getClickCount()))
                .toList();

        var topClicked = topClickedRow.stream()
                .map(r -> new TopClickedItem(r.getItemId(), r.getName(), r.getClickCount()))
                .toList();

        return new DashboardOverviewResponseDto(
                new Meta(from, to, Instant.now()),
                new Metrics(summary, dailySessions, dailyClicks, topClicked)
        );
    }
}