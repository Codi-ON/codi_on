// src/main/java/com/team/backend/api/dto/log/RecommendationEventLogResponseDto.java
package com.team.backend.api.dto.log;

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

    private String sessionKey;
    private String recommendationId; // uuid string
    private String funnelStep;

    private String eventType;
    private String payloadJson;      // jsonb -> text
}