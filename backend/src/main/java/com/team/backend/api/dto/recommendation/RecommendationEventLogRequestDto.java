// src/main/java/com/team/backend/api/dto/recommendation/RecommendationEventLogRequestDto.java
package com.team.backend.api.dto.recommendation;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationEventLogRequestDto {
    private Long id;
    private OffsetDateTime createdAt;
    private Long userId;
    private UUID sessionId;
    private Long recommendationId;
    private String eventType;
    /**
     * DB payload(jsonb)를 그대로 text로 변환해서 담는 필드
     * - 프론트/관리자 페이지에서 raw JSON 확인용
     */
    private String payloadJson;
}