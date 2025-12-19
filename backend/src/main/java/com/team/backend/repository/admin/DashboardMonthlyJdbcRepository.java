// src/main/java/com/team/backend/repository/admin/DashboardMonthlyJdbcRepository.java
package com.team.backend.repository.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class DashboardMonthlyJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public List<MonthlyRow> fetchMonthly(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            WITH months AS (
              SELECT date_trunc('month', gs)::date AS month_start
              FROM generate_series(
                     date_trunc('month', :from AT TIME ZONE 'Asia/Seoul'),
                     date_trunc('month', (:to  AT TIME ZONE 'Asia/Seoul') - interval '1 day'),
                     interval '1 month'
                   ) gs
            ),
            session_m AS (
              SELECT
                date_trunc('month', created_at AT TIME ZONE 'Asia/Seoul')::date AS month_start,
                COUNT(*) AS total_session_events,
                COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL AND event_type = 'START') AS unique_session_users,
                COUNT(*) FILTER (WHERE event_type = 'ERROR') AS error_events,
                COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'START') AS started_sessions,
                COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'END') AS ended_sessions
              FROM public.session_log
              WHERE created_at >= :from AND created_at < :to
              GROUP BY 1
            ),
            click_m AS (
              SELECT
                date_trunc('month', created_at AT TIME ZONE 'Asia/Seoul')::date AS month_start,
                COUNT(*) AS total_clicks,
                COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_click_users
              FROM public.item_click_log
              WHERE created_at >= :from AND created_at < :to
              GROUP BY 1
            ),
            reco_m AS (
              SELECT
                date_trunc('month', created_at AT TIME ZONE 'Asia/Seoul')::date AS month_start,
                COUNT(*) AS reco_event_count
              FROM public.recommendation_event_log
              WHERE created_at >= :from AND created_at < :to
              GROUP BY 1
            )
            SELECT
              to_char(m.month_start, 'YYYY-MM') AS month,
              COALESCE(s.started_sessions, 0) AS started_sessions,
              COALESCE(s.ended_sessions, 0) AS ended_sessions,
              COALESCE(s.error_events, 0) AS error_events,
              COALESCE(s.total_session_events, 0) AS total_session_events,
              COALESCE(s.unique_session_users, 0) AS unique_session_users,
              COALESCE(c.total_clicks, 0) AS total_clicks,
              COALESCE(c.unique_click_users, 0) AS unique_click_users,
              COALESCE(r.reco_event_count, 0) AS reco_event_count
            FROM months m
            LEFT JOIN session_m s ON s.month_start = m.month_start
            LEFT JOIN click_m   c ON c.month_start = m.month_start
            LEFT JOIN reco_m    r ON r.month_start = m.month_start
            ORDER BY m.month_start
        """;

        return jdbc.query(
                sql,
                Map.of("from", from, "to", to),
                (rs, rowNum) -> new MonthlyRow(
                        rs.getString("month"),
                        rs.getLong("started_sessions"),
                        rs.getLong("ended_sessions"),
                        rs.getLong("error_events"),
                        rs.getLong("total_session_events"),
                        rs.getLong("unique_session_users"),
                        rs.getLong("total_clicks"),
                        rs.getLong("unique_click_users"),
                        rs.getLong("reco_event_count")
                )
        );
    }

    public record MonthlyRow(
            String month,
            long startedSessions,
            long endedSessions,
            long errorEvents,
            long totalSessionEvents,
            long uniqueSessionUsers,
            long totalClicks,
            long uniqueClickUsers,
            long recoEventCount
    ) {}
}