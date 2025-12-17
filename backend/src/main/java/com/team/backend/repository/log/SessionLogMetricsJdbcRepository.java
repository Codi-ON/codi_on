package com.team.backend.repository.log;

import com.team.backend.api.dto.session.SessionDailyTrendResponseDto;
import com.team.backend.api.dto.session.SessionHourlyUsageResponseDto;
import com.team.backend.api.dto.session.SessionMetricsSummaryResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class SessionLogMetricsJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public SessionMetricsSummaryResponseDto findSummary(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
                SELECT
                    COUNT(*) AS total_sessions,
                    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_users,
                    CASE
                        WHEN COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) = 0
                            THEN 0
                        ELSE ROUND(
                            COUNT(*)::numeric
                            / COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL),
                            2
                        )
                    END AS avg_sessions_per_user
                FROM public.session_log
                WHERE created_at >= :from
                  AND created_at <  :to
                """;

        return jdbc.queryForObject(
                sql,
                Map.of("from", from, "to", to),
                (rs, rowNum) -> SessionMetricsSummaryResponseDto.builder()
                        .totalSessions(rs.getLong("total_sessions"))
                        .uniqueUsers(rs.getLong("unique_users"))
                        .avgSessionsPerUser(rs.getBigDecimal("avg_sessions_per_user"))
                        .build()
        );
    }

    public List<SessionDailyTrendResponseDto> findDailyTrend(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
                SELECT
                    (created_at AT TIME ZONE 'Asia/Seoul')::date AS log_date,
                    COUNT(*) AS session_count,
                    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_user_count
                FROM public.session_log
                WHERE created_at >= :from
                  AND created_at <  :to
                GROUP BY log_date
                ORDER BY log_date
                """;

        return jdbc.query(
                sql,
                Map.of("from", from, "to", to),
                this::mapDailyTrend
        );
    }

    public List<SessionHourlyUsageResponseDto> findHourlyUsage(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
                SELECT
                    EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Asia/Seoul'))::int AS hour,
                    COUNT(*) AS session_count
                FROM public.session_log
                WHERE created_at >= :from
                  AND created_at <  :to
                GROUP BY hour
                ORDER BY hour
                """;

        return jdbc.query(
                sql,
                Map.of("from", from, "to", to),
                this::mapHourlyUsage
        );
    }

    private SessionDailyTrendResponseDto mapDailyTrend(ResultSet rs, int rowNum) throws SQLException {
        LocalDate date = rs.getObject("log_date", LocalDate.class);
        long sessionCount = rs.getLong("session_count");
        long uniqueUserCount = rs.getLong("unique_user_count");

        return SessionDailyTrendResponseDto.builder()
                .date(date)
                .sessionCount(sessionCount)
                .uniqueUserCount(uniqueUserCount)
                .build();
    }

    private SessionHourlyUsageResponseDto mapHourlyUsage(ResultSet rs, int rowNum) throws SQLException {
        int hour = rs.getInt("hour");
        long sessionCount = rs.getLong("session_count");

        return SessionHourlyUsageResponseDto.builder()
                .hour(hour)
                .sessionCount(sessionCount)
                .build();
    }
}