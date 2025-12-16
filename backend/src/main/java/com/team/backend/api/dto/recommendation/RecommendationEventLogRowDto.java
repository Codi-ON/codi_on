package com.team.backend.api.dto.recommendation;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationEventLogRowDto {
    private Long id;
    private OffsetDateTime createdAt;

    private Long userId;
    private UUID sessionId;
    private Long recommendationId;

    private String eventType;
    private String payloadJson; // jsonb -> String
}