// src/main/java/com/team/backend/api/dto/recommendation/ItemClickLogRequestDto.java
package com.team.backend.api.dto.recommendation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemClickLogRequestDto {

    // nullable: null이면 DB now() 사용 or 서비스에서 now() 세팅
    private OffsetDateTime createdAt;

    @NotNull private Long userId;
    @NotNull private UUID sessionId;

    // 추천 흐름과 연결되는 경우만 값 존재
    private Long recommendationId;

    @NotNull private Long clothingItemId;

    // 문자열 유지(이미 쓰고 있으면 그대로)
    @NotNull private String eventType;

    // 자유형 JSON
    private Map<String, Object> payload;

    private static final ObjectMapper OM = new ObjectMapper();

    public String getPayloadJson() {
        if (payload == null) return null;
        try {
            return OM.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid payload JSON", e);
        }
    }
}