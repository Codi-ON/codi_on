// src/main/java/com/team/backend/service/admin/DashboardOverviewMapper.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewMetricsDto;
import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DashboardOverviewMapper {

    public DashboardOverviewResponseDto toResponse(
            OffsetDateTime fromInclusive,
            OffsetDateTime toExclusive,
            String timezone,
            DashboardOverviewMetricsDto.Metrics metrics
    ) {
        OffsetDateTime generatedAt = OffsetDateTime.now();

        List<DashboardOverviewResponseDto.Card> cards = getCards(metrics);

        var dailySessions = metrics.dailySessions();
        var dailyClicks = metrics.dailyClicks();
        var topClickedItems = metrics.topClickedItems();

        DashboardOverviewResponseDto.Chart sessionsChart =
                new DashboardOverviewResponseDto.Chart(
                        "sessionsDaily",
                        "일별 세션 추이",
                        "date",
                        "count",
                        List.of(
                                new DashboardOverviewResponseDto.Series(
                                        "sessions",
                                        dailySessions.stream()
                                                .map(d -> new DashboardOverviewResponseDto.Point(d.date().toString(), d.sessionEventCount()))
                                                .toList()
                                ),
                                new DashboardOverviewResponseDto.Series(
                                        "uniqueUsers",
                                        dailySessions.stream()
                                                .map(d -> new DashboardOverviewResponseDto.Point(d.date().toString(), d.uniqueUserCount()))
                                                .toList()
                                )
                        )
                );

        DashboardOverviewResponseDto.Chart clicksChart =
                new DashboardOverviewResponseDto.Chart(
                        "clicksDaily",
                        "일별 클릭 추이",
                        "date",
                        "count",
                        List.of(
                                new DashboardOverviewResponseDto.Series(
                                        "clicks",
                                        dailyClicks.stream()
                                                .map(d -> new DashboardOverviewResponseDto.Point(d.date().toString(), d.clickCount()))
                                                .toList()
                                )
                        )
                );

        DashboardOverviewResponseDto.Table topClickedTable =
                new DashboardOverviewResponseDto.Table(
                        "topClickedItems",
                        "TOP 클릭 아이템",
                        List.of("itemId", "name", "clickCount"),
                        topClickedItems.stream()
                                .map(r -> Map.<String, Object>of(
                                        "itemId", r.itemId(),
                                        "name", r.name(),
                                        "clickCount", r.clickCount()
                                ))
                                .toList()
                );

        Map<String, DashboardOverviewResponseDto.Section> sections = new LinkedHashMap<>();
        sections.put("overview",
                new DashboardOverviewResponseDto.Section(
                        "Overview",
                        cards,
                        List.of(sessionsChart, clicksChart),
                        List.of(topClickedTable)
                )
        );

        return new DashboardOverviewResponseDto(
                new DashboardOverviewResponseDto.Meta(generatedAt, timezone),
                new DashboardOverviewResponseDto.Range(fromInclusive, toExclusive),
                sections
        );
    }

    private static List<DashboardOverviewResponseDto.Card> getCards(DashboardOverviewMetricsDto.Metrics metrics) {
        var s = metrics.summary();

        return List.of(
                new DashboardOverviewResponseDto.Card("totalSessions", "세션 수", s.totalSessions(), "건"),
                new DashboardOverviewResponseDto.Card("uniqueUsers", "유니크 유저", s.uniqueUsers(), "명"),
                new DashboardOverviewResponseDto.Card("avgSessionsPerUser", "유저당 평균 세션", s.avgSessionsPerUser(), "회"),

                new DashboardOverviewResponseDto.Card("totalClicks", "클릭 수", s.totalClicks(), "건"),
                new DashboardOverviewResponseDto.Card("totalRecoEvents", "추천 이벤트", s.totalRecoEvents(), "건"),

                new DashboardOverviewResponseDto.Card("errorEvents", "에러 로그", s.errorEvents(), "건"),
                new DashboardOverviewResponseDto.Card("sessionEndRate", "세션 종료율", s.sessionEndRate(), "%"),
                new DashboardOverviewResponseDto.Card("recoEmptyRate", "추천 빈결과 비율", s.recoEmptyRate(), "%")
        );
    }
}