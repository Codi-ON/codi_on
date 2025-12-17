// src/main/java/com/team/backend/api/dto/recommendation/RecommendationEventLogResponseDto.java
package com.team.backend.api.dto.recommendation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationEventLogResponseDto {

    private Long id;
    private OffsetDateTime createdAt;
    private Long userId;
    private String sessionId;        // UUID → 문자열
    private Long recommendationId;
    private String eventType;
    private String payloadJson;

    public static RecommendationEventLogResponseDto from(RecommendationEventLogRequestDto row) {
        return RecommendationEventLogResponseDto.builder()
                .id(row.getId())
                .createdAt(row.getCreatedAt())
                .userId(row.getUserId())
                .sessionId(row.getSessionId() != null ? row.getSessionId().toString() : null)
                .recommendationId(row.getRecommendationId())
                .eventType(row.getEventType())
                .payloadJson(row.getPayloadJson())
                .build();
    }
}