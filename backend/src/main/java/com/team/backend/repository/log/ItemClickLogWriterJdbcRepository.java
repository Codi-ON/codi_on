package com.team.backend.repository.log;// src/main/java/com/team/backend/repository/log/ItemClickLogJdbcRepository.java

import com.team.backend.api.dto.log.ItemClickLogResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ItemClickLogWriterJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public ItemClickLogResponseDto insert(Long userId, Long clothingItemId, String eventType, String payloadJson) {

        String sql = """
            INSERT INTO public.item_click_log (user_id, clothing_item_id, event_type, payload)
            VALUES (:userId, :clothingItemId, :eventType, CAST(:payload AS jsonb))
            RETURNING id, created_at
        """;

        return jdbc.queryForObject(
                sql,
                Map.of(
                        "userId", userId,
                        "clothingItemId", clothingItemId,
                        "eventType", eventType,
                        "payload", payloadJson // null 가능
                ),
                (rs, rowNum) -> new ItemClickLogResponseDto(
                        rs.getLong("id"),
                        rs.getObject("created_at", OffsetDateTime.class)
                )
        );
    }
}