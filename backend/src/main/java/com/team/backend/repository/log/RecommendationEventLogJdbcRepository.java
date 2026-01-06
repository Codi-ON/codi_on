// src/main/java/com/team/backend/repository/log/RecommendationEventLogJdbcRepository.java
package com.team.backend.repository.log;

import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.log.RecommendationEventLogResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RecommendationEventLogJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public void insert(RecommendationEventLogRequestDto dto) {
        String sql = """
            INSERT INTO public.recommendation_event_log (
                created_at,
                user_id,
                session_key,
                recommendation_id,
                funnel_step,
                event_type,
                payload
            )
            VALUES (
                COALESCE(:createdAt, now()),
                :userId,
                :sessionKey,
                :recommendationId,
                :funnelStep,
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
                .addValue("sessionKey", dto.getSessionKey())
                // ✅ UUID 그대로 바인딩
                .addValue("recommendationId", dto.getRecommendationId())
                .addValue("funnelStep", dto.getFunnelStep())
                .addValue("eventType", dto.getEventType())
                .addValue("payloadJson", dto.payloadJsonOrNull());

        jdbc.update(sql, p);
    }

    public List<RecommendationEventLogResponseDto> findRecent(Integer limit) {
        int resolved = (limit == null ? 200 : Math.min(Math.max(limit, 1), 200));

        String sql = """
            SELECT
              id,
              created_at,
              user_id,
              session_key,
              recommendation_id,
              funnel_step,
              event_type,
              CASE WHEN payload IS NULL THEN NULL ELSE payload::text END AS payload_json
            FROM public.recommendation_event_log
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """;

        return jdbc.query(sql, new MapSqlParameterSource("limit", resolved), this::mapRow);
    }

    private RecommendationEventLogResponseDto mapRow(ResultSet rs, int rowNum) throws SQLException {
        UUID recoId = (UUID) rs.getObject("recommendation_id");

        return RecommendationEventLogResponseDto.builder()
                .id(rs.getLong("id"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .userId((Long) rs.getObject("user_id"))
                .sessionKey(rs.getString("session_key"))
                .recommendationId(recoId == null ? null : recoId.toString())
                .funnelStep(rs.getString("funnel_step"))
                .eventType(rs.getString("event_type"))
                .payloadJson(rs.getString("payload_json"))
                .build();
    }
}