// src/main/java/com/team/backend/api/dto/recommendation/RecommendationEventLogResponseDto.java
package com.team.backend.api.dto.recommendation;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationEventLogResponseDto {

    private Long id;
    private OffsetDateTime createdAt;
    private Long userId;

    // DB uuid -> 문자열로 내려도 OK
    private String sessionId;

    private String sessionKey;
    private Long recommendationId;

    private String eventType;

    // DB jsonb -> text
    private String payloadJson;

    public static RecommendationEventLogResponseDto of(
            Long id,
            OffsetDateTime createdAt,
            Long userId,
            String sessionId,
            String sessionKey,
            Long recommendationId,
            String eventType,
            String payloadJson
    ) {
        return RecommendationEventLogResponseDto.builder()
                .id(id)
                .createdAt(createdAt)
                .userId(userId)
                .sessionId(sessionId)
                .sessionKey(sessionKey)
                .recommendationId(recommendationId)
                .eventType(eventType)
                .payloadJson(payloadJson)
                .build();
    }
}