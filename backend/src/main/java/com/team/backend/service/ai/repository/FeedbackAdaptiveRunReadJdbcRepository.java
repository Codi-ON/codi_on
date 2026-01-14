package com.team.backend.service.ai.repository;

import lombok.*;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class FeedbackAdaptiveRunReadJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    @Getter
    @AllArgsConstructor
    public static class Row {
        private UUID feedbackId;
        private String status;
        private Long latencyMs;
        private OffsetDateTime requestedAt;
        private OffsetDateTime succeededAt;
        private OffsetDateTime failedAt;
        private String responseJson; // jsonb -> text
    }

    public Optional<Row> findLatestBySessionAndYm(String sessionKey, int year, int month) {
        String sql = """
            SELECT
              feedback_id,
              status,
              latency_ms,
              requested_at,
              succeeded_at,
              failed_at,
              response_json::text AS response_json
            FROM public.feedback_adaptive_run
            WHERE session_key = :sessionKey
              AND year = :year
              AND month = :month
            ORDER BY created_at DESC
            LIMIT 1
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("sessionKey", sessionKey)
                .addValue("year", year)
                .addValue("month", month);

        List<Row> rows = jdbc.query(sql, p, (ResultSet rs, int idx) -> new Row(
                (UUID) rs.getObject("feedback_id"),
                rs.getString("status"),
                rs.getObject("latency_ms") == null ? null : rs.getLong("latency_ms"),
                rs.getObject("requested_at") == null ? null : rs.getObject("requested_at", OffsetDateTime.class),
                rs.getObject("succeeded_at") == null ? null : rs.getObject("succeeded_at", OffsetDateTime.class),
                rs.getObject("failed_at") == null ? null : rs.getObject("failed_at", OffsetDateTime.class),
                rs.getString("response_json")
        ));

        return rows.stream().findFirst();
    }
}