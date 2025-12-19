// src/main/java/com/team/backend/repository/admin/DashboardOverviewJdbcRepository.java
package com.team.backend.repository.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewMetricsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class DashboardOverviewJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public DashboardOverviewMetricsDto.Summary findSummary(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              (SELECT COUNT(*) 
                 FROM public.session_log 
                WHERE created_at >= :from AND created_at < :to) AS total_session_events,

              (SELECT COUNT(DISTINCT session_id)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND session_id IS NOT NULL) AS total_sessions,

              (SELECT COUNT(DISTINCT user_id)
                 FROM public.session_log
                WHERE user_id IS NOT NULL
                  AND created_at >= :from AND created_at < :to) AS unique_users,

              (SELECT COUNT(*)
                 FROM public.item_click_log
                WHERE created_at >= :from AND created_at < :to) AS total_clicks,

              (SELECT COUNT(*)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to) AS total_reco_events,

              (SELECT COUNT(*)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'ERROR') AS error_events,

              (SELECT COUNT(DISTINCT session_id)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'START') AS started_sessions,

              (SELECT COUNT(DISTINCT session_id)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'END') AS ended_sessions,

              (SELECT COUNT(*)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'RECO_TODAY_EMPTY') AS reco_empty,

              (SELECT COUNT(*)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'RECO_TODAY_GENERATED') AS reco_generated
            """;

        return jdbc.queryForObject(sql, Map.of("from", from, "to", to), (rs, rowNum) -> {
            long totalSessionEvents = rs.getLong("total_session_events");
            long totalSessions      = rs.getLong("total_sessions");
            long uniqueUsers        = rs.getLong("unique_users");

            double avgSessionsPerUser =
                    (uniqueUsers == 0) ? 0.0 : round2((double) totalSessions / (double) uniqueUsers);

            long startedSessions = rs.getLong("started_sessions");
            long endedSessions   = rs.getLong("ended_sessions");
            double sessionEndRate =
                    (startedSessions == 0) ? 0.0 : round2((double) endedSessions * 100.0 / (double) startedSessions);

            long recoEmpty     = rs.getLong("reco_empty");
            long recoGenerated = rs.getLong("reco_generated");
            long recoTotalForRate = recoEmpty + recoGenerated;
            double recoEmptyRate =
                    (recoTotalForRate == 0) ? 0.0 : round2((double) recoEmpty * 100.0 / (double) recoTotalForRate);

            return new DashboardOverviewMetricsDto.Summary(
                    totalSessionEvents,
                    totalSessions,
                    uniqueUsers,
                    avgSessionsPerUser,

                    rs.getLong("total_clicks"),
                    rs.getLong("total_reco_events"),

                    rs.getLong("error_events"),

                    startedSessions,
                    endedSessions,
                    sessionEndRate,

                    recoEmpty,
                    recoGenerated,
                    recoEmptyRate
            );
        });
    }

    public List<DashboardOverviewMetricsDto.DailySessions> findDailySessions(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              (created_at AT TIME ZONE 'Asia/Seoul')::date AS d,
              COUNT(*) AS session_event_count,
              COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_user_count
            FROM public.session_log
            WHERE created_at >= :from
              AND created_at <  :to
            GROUP BY d
            ORDER BY d
            """;

        return jdbc.query(sql, Map.of("from", from, "to", to), (rs, rowNum) ->
                new DashboardOverviewMetricsDto.DailySessions(
                        rs.getObject("d", LocalDate.class),
                        rs.getLong("session_event_count"),
                        rs.getLong("unique_user_count")
                )
        );
    }

    public List<DashboardOverviewMetricsDto.DailyClicks> findDailyClicks(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              (created_at AT TIME ZONE 'Asia/Seoul')::date AS d,
              COUNT(*) AS click_count
            FROM public.item_click_log
            WHERE created_at >= :from
              AND created_at <  :to
            GROUP BY d
            ORDER BY d
            """;

        return jdbc.query(sql, Map.of("from", from, "to", to), (rs, rowNum) ->
                new DashboardOverviewMetricsDto.DailyClicks(
                        rs.getObject("d", LocalDate.class),
                        rs.getLong("click_count")
                )
        );
    }

    public List<DashboardOverviewMetricsDto.TopClickedItem> findTopClickedItems(OffsetDateTime from, OffsetDateTime to, int topN) {
        String sql = """
            SELECT
              l.clothing_item_id AS item_id,
              COALESCE(i.name, '(unknown)') AS name,
              COUNT(*) AS click_count
            FROM public.item_click_log l
            LEFT JOIN public.clothing_item i ON i.id = l.clothing_item_id
            WHERE l.created_at >= :from
              AND l.created_at <  :to
            GROUP BY l.clothing_item_id, i.name
            ORDER BY click_count DESC
            LIMIT :topN
            """;

        return jdbc.query(sql, Map.of("from", from, "to", to, "topN", topN), (rs, rowNum) ->
                new DashboardOverviewMetricsDto.TopClickedItem(
                        rs.getLong("item_id"),
                        rs.getString("name"),
                        rs.getLong("click_count")
                )
        );
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}