package com.team.backend.repository.log;

import com.team.backend.api.dto.recommendation.ItemClickLogRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ItemClickLogJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    /**
     * item_click_log에 클릭 이벤트 1건 저장
     * - createdAt 이 null이면 DB now() 사용
     * - payloadJson 이 null이 아니면 jsonb로 캐스팅해서 저장
     */
    public void write(ItemClickLogRequestDto dto) {
        String sql = """
                INSERT INTO public.item_click_log (
                    created_at,
                    user_id,
                    session_id,
                    recommendation_id,
                    clothing_item_id,
                    event_type,
                    payload
                )
                VALUES (
                    COALESCE(:createdAt, now()),
                    :userId,
                    :sessionId,
                    :recommendationId,
                    :clothingItemId,
                    :eventType,
                    CASE
                        WHEN :payloadJson IS NULL THEN NULL
                        ELSE CAST(:payloadJson AS jsonb)
                    END
                )
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("createdAt", dto.getCreatedAt())
                .addValue("userId", dto.getUserId())
                .addValue("sessionId", dto.getSessionId())
                .addValue("recommendationId", dto.getRecommendationId())
                .addValue("clothingItemId", dto.getClothingItemId())
                .addValue("eventType", dto.getEventType())
                .addValue("payloadJson", dto.getPayloadJson());

        jdbc.update(sql, params);
    }
}