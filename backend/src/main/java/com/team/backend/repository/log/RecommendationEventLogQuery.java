package com.team.backend.repository.log;

import com.team.backend.api.dto.recommendation.RecommendationEventLogRowDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class RecommendationEventLogQuery {

    private final NamedParameterJdbcTemplate jdbc;

    public List<RecommendationEventLogRowDto> findRecent(int limit) {
        int resolved = Math.min(Math.max(limit, 1), 200);

        String sql = """
            SELECT id, created_at, user_id, session_id, recommendation_id, event_type,
                   CASE WHEN payload IS NULL THEN NULL ELSE payload::text END AS payload_json
            FROM recommendation_event_log
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """;

        return jdbc.query(sql, Map.of("limit", resolved), (rs, rowNum) -> map(rs));
    }

    public List<RecommendationEventLogRowDto> findByCreatedAtBetween(OffsetDateTime from, OffsetDateTime to, int limit) {
        int resolved = Math.min(Math.max(limit, 1), 500);

        String sql = """
            SELECT id, created_at, user_id, session_id, recommendation_id, event_type,
                   CASE WHEN payload IS NULL THEN NULL ELSE payload::text END AS payload_json
            FROM recommendation_event_log
            WHERE created_at >= :from AND created_at < :to
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """;

        return jdbc.query(sql, Map.of("from", from, "to", to, "limit", resolved), (rs, rowNum) -> map(rs));
    }

    private RecommendationEventLogRowDto map(ResultSet rs) throws java.sql.SQLException {
        return RecommendationEventLogRowDto.builder()
                .id(rs.getLong("id"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .userId((Long) rs.getObject("user_id"))
                .sessionId((java.util.UUID) rs.getObject("session_id"))
                .recommendationId((Long) rs.getObject("recommendation_id"))
                .eventType(rs.getString("event_type"))
                .payloadJson(rs.getString("payload_json"))
                .build();
    }
}