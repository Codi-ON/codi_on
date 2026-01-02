// src/main/java/com/team/backend/repository/log/RecommendationEventLogJdbcRepository.java
package com.team.backend.repository.log;

import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.recommendation.RecommendationEventLogResponseDto;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
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
import java.util.stream.Collectors;

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
                session_key,
                recommendation_id,
                event_type,
                payload
            )
            VALUES (
                COALESCE(:createdAt, now()),
                :userId,
                :sessionId,
                :sessionKey,
                :recommendationId,
                :eventType,
                CASE
                    WHEN :payloadJson IS NULL THEN NULL
                    ELSE CAST(:payloadJson AS jsonb)
                END
            )
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("createdAt", dto.getCreatedAt())
                .addValue("userId", dto.getUserId())
                .addValue("sessionId", dto.getSessionId()) // UUID
                .addValue("sessionKey", dto.getSessionKey())
                .addValue("recommendationId", dto.getRecommendationId())
                // ✅ enum -> DB 저장은 문자열로 (repo에서만 변환)
                .addValue("eventType", dto.getEventType().name(), Types.VARCHAR)
                .addValue("payloadJson", dto.getPayloadJson(), Types.VARCHAR);

        jdbc.update(sql, p);
    }

    // ======================
    // 2) READ - 최근 N개
    // ======================
    public List<RecommendationEventLogResponseDto> findRecent(Integer limit) {
        int resolved = resolveLimit(limit, 1, 200);

        String sql = """
            SELECT
                id,
                created_at,
                user_id,
                session_id,
                session_key,
                recommendation_id,
                event_type,
                CASE WHEN payload IS NULL THEN NULL ELSE payload::text END AS payload_json
            FROM public.recommendation_event_log
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """;

        return jdbc.query(sql, new MapSqlParameterSource("limit", resolved), this::mapRow);
    }

    // ===========================
    // 3) READ - 기간 + 타입 필터
    // ===========================
    public List<RecommendationEventLogResponseDto> findRange(
            OffsetDateTime from,
            OffsetDateTime to,
            List<RecommendationEventType> eventTypes,
            Integer limit
    ) {
        int resolved = resolveLimit(limit, 1, 500);
        boolean hasTypes = eventTypes != null && !eventTypes.isEmpty();

        String sql = """
            SELECT
                id,
                created_at,
                user_id,
                session_id,
                session_key,
                recommendation_id,
                event_type,
                CASE WHEN payload IS NULL THEN NULL ELSE payload::text END AS payload_json
            FROM public.recommendation_event_log
            WHERE created_at >= :from
              AND created_at <  :to
            """ + (hasTypes ? " AND event_type IN (:eventTypes) " : "") + """
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("from", from)
                .addValue("to", to)
                .addValue("limit", resolved);

        if (hasTypes) {
            // ✅ 여기서만 enum -> name() 변환
            p.addValue(
                    "eventTypes",
                    eventTypes.stream()
                            .map(RecommendationEventType::name)
                            .collect(Collectors.toList())
            );
        }

        return jdbc.query(sql, p, this::mapRow);
    }

    // -----------------------
    // 내부 헬퍼
    // -----------------------
    private int resolveLimit(Integer limit, int min, int max) {
        int v = (limit == null ? max : limit);
        if (v < min) v = min;
        if (v > max) v = max;
        return v;
    }

    private RecommendationEventLogResponseDto mapRow(ResultSet rs, int rowNum) throws SQLException {
        Long id = rs.getLong("id");
        OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
        Long userId = (Long) rs.getObject("user_id");
        UUID sessionId = (UUID) rs.getObject("session_id");
        String sessionKey = rs.getString("session_key");
        Long recommendationId = (Long) rs.getObject("recommendation_id");
        String eventType = rs.getString("event_type");
        String payloadJson = rs.getString("payload_json");

        return RecommendationEventLogResponseDto.builder()
                .id(id)
                .createdAt(createdAt)
                .userId(userId)
                .sessionId(sessionId == null ? null : sessionId.toString())
                .sessionKey(sessionKey)
                .recommendationId(recommendationId)
                .eventType(eventType)
                .payloadJson(payloadJson)
                .build();
    }
}