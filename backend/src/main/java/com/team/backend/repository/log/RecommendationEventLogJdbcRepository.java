// src/main/java/com/team/backend/repository/log/RecommendationEventLogJdbcRepository.java
package com.team.backend.repository.log;

import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RecommendationEventLogJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    // ==========
    // 1) WRITE
    // ==========
    public void write(RecommendationEventLogRequestDto dto) {
        String sql = """
                INSERT INTO public.recommendation_event_log (
                    created_at,
                    user_id,
                    session_id,
                    recommendation_id,
                    event_type,
                    payload
                )
                VALUES (
                    COALESCE(:createdAt, now()),
                    :userId,
                    :sessionId,
                    :recommendationId,
                    :eventType,
                    CAST(:payloadJson AS jsonb)
                )
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("createdAt", dto.getCreatedAt())          // null 허용
                .addValue("userId", dto.getUserId())                // null 허용
                .addValue("sessionId", dto.getSessionId())          // null 허용(UUID)
                .addValue("recommendationId", dto.getRecommendationId()) // null 허용
                .addValue("eventType", dto.getEventType())          // NOT NULL
                // payloadJson은 VARCHAR로 명시해서 jsonb 캐스팅만 DB에게 맡김
                .addValue("payloadJson", dto.getPayloadJson(), Types.VARCHAR);

        jdbc.update(sql, params);
    }

    // ======================
    // 2) READ - 최근 N개
    // ======================
    public List<RecommendationEventLogRequestDto> findRecent(int limit) {
        int resolved = resolveLimit(limit, 1, 200);

        String sql = """
                SELECT id,
                       created_at,
                       user_id,
                       session_id,
                       recommendation_id,
                       event_type,
                       CASE WHEN payload IS NULL THEN NULL ELSE payload::text END AS payload_json
                FROM public.recommendation_event_log
                ORDER BY created_at DESC, id DESC
                LIMIT :limit
                """;

        return jdbc.query(
                sql,
                new MapSqlParameterSource("limit", resolved),
                this::mapRow
        );
    }

    // ===========================
    // 3) READ - 기간 필터 조회
    // ===========================
    public List<RecommendationEventLogRequestDto> findByCreatedAtBetween(
            OffsetDateTime from,
            OffsetDateTime to,
            int limit
    ) {
        int resolved = resolveLimit(limit, 1, 500);

        String sql = """
                SELECT id,
                       created_at,
                       user_id,
                       session_id,
                       recommendation_id,
                       event_type,
                       CASE WHEN payload IS NULL THEN NULL ELSE payload::text END AS payload_json
                FROM public.recommendation_event_log
                WHERE created_at >= :from
                  AND created_at < :to
                ORDER BY created_at DESC, id DESC
                LIMIT :limit
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("from", from)
                .addValue("to", to)
                .addValue("limit", resolved);

        return jdbc.query(sql, params, this::mapRow);
    }

    // ======================
    // 내부 헬퍼
    // ======================
    private int resolveLimit(Integer limit, int min, int max) {
        int v = (limit == null ? max : limit);
        if (v < min) v = min;
        if (v > max) v = max;
        return v;
    }

    private RecommendationEventLogRequestDto mapRow(ResultSet rs, int rowNum) throws SQLException {
        Long id = rs.getLong("id");
        OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
        Long userId = (Long) rs.getObject("user_id");
        UUID sessionId = (UUID) rs.getObject("session_id");
        Long recommendationId = (Long) rs.getObject("recommendation_id");
        String eventType = rs.getString("event_type");
        String payloadJson = rs.getString("payload_json");

        return RecommendationEventLogRequestDto.builder()
                .id(id)
                .createdAt(createdAt)
                .userId(userId)
                .sessionId(sessionId)
                .recommendationId(recommendationId)
                .eventType(eventType)
                .payloadJson(payloadJson)
                .build();
    }
}