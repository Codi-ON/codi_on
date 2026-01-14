package com.team.backend.repository.log;

import com.team.backend.api.dto.log.ItemClickLogCreateRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ItemClickLogJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public void insert(ItemClickLogCreateRequestDto dto, String funnelStep) {
        String sql = """
            INSERT INTO public.item_click_log (
                created_at,
                session_key,
                user_id,
                recommendation_id,
                clothing_id,
                funnel_step,
                event_type,
                payload
            )
            VALUES (
                COALESCE(:createdAt, now()),
                :sessionKey,
                :userId,
                :recommendationId,
                :clothingId,
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
                .addValue("sessionKey", dto.getSessionKey())
                .addValue("userId", dto.getUserId())
                .addValue("recommendationId", dto.getRecommendationUuid())
                .addValue("clothingId", dto.getClothingItemId())
                .addValue("funnelStep", funnelStep)
                .addValue("eventType", dto.getEventType())
                .addValue("payloadJson", dto.payloadJsonOrNull());

        jdbc.update(sql, p);
    }
}