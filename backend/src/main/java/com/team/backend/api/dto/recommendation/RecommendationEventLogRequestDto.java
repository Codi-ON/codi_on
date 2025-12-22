// src/main/java/com/team/backend/api/dto/recommendation/RecommendationEventLogRequestDto.java
package com.team.backend.api.dto.recommendation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationEventLogRequestDto {

    // nullable, null이면 DB now()
    private OffsetDateTime createdAt;

    private Long userId;

    // 둘 중 하나는 필수(서비스에서 검증)
    private UUID sessionId;
    private String sessionKey;

    private Long recommendationId;

    // 예: CHECKLIST_SUBMITTED, RECO_GENERATED ...
    private RecommendationEventType eventType;

    /**
     * 요청에서 들어오는 자유형 JSON (Swagger에선 object)
     */
    private Map<String, Object> payload;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public String getPayloadJson() {
        if (payload == null) return null;
        try {
            return OBJECT_MAPPER.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            // 로그용이니까 추천 흐름을 죽이지 말고 최소 JSON으로 대체
            return "{\"payloadSerializeError\":true}";
        }
    }
}