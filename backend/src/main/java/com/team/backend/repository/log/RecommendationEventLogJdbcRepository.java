// src/main/java/com/team/backend/repository/log/RecommendationEventLogJdbcRepository.java
package com.team.backend.repository.log;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RecommendationEventLogJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    private static final ObjectMapper OM = new ObjectMapper();

    /**
     * ✅ 표준 insert (서비스에서 이 메서드만 호출하도록 고정)
     * - createdAt null이면 DB now()로
     * - payload null/blank면 {}
     */
    public void insert(RecommendationEventLogRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("dto is null");
        if (dto.getSessionKey() == null || dto.getSessionKey().isBlank()) {
            throw new IllegalArgumentException("sessionKey is required");
        }
        if (dto.getEventType() == null || dto.getEventType().isBlank()) {
            throw new IllegalArgumentException("eventType is required");
        }

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
              CAST(:payloadJson AS jsonb)
            )
            """;

        String payloadJson = toJsonOrEmpty(dto.getPayload());

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("createdAt", dto.getCreatedAt())
                .addValue("userId", dto.getUserId())
                .addValue("sessionKey", dto.getSessionKey())
                .addValue("recommendationId", dto.getRecommendationId())
                .addValue("funnelStep", dto.getFunnelStep()) // null 허용이면 스키마도 null 허용이어야 함
                .addValue("eventType", dto.getEventType())
                .addValue("payloadJson", payloadJson);

        jdbc.update(sql, p);
    }

    /**
     * ✅ 권장: funnelStep까지 받는 헬퍼 (NOT NULL이면 이걸로만 찍어야 안전)
     */
    public void insertEvent(String sessionKey, UUID recommendationId, String funnelStep, String eventType, Map<String, Object> payload) {
        insert(RecommendationEventLogRequestDto.builder()
                .createdAt(null) // DB now()
                .userId(null)
                .sessionKey(sessionKey)
                .recommendationId(recommendationId)
                .funnelStep(funnelStep)
                .eventType(eventType)
                .payload(payload)
                .build());
    }

    /**
     * (호환용) funnelStep 없이 찍는 버전
     * - funnel_step NOT NULL이면 사용 금지
     */
    public void insertEvent(String sessionKey, UUID recommendationId, String eventType, Map<String, Object> payload) {
        insert(RecommendationEventLogRequestDto.builder()
                .createdAt(null)
                .userId(null)
                .sessionKey(sessionKey)
                .recommendationId(recommendationId)
                .funnelStep(null)
                .eventType(eventType)
                .payload(payload)
                .build());
    }

    private String toJsonOrEmpty(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) return "{}";
        try {
            return OM.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{\"payloadSerializeError\":true}";
        }
    }
}