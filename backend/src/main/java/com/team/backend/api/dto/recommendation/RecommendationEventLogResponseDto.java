// src/main/java/com/team/backend/api/dto/recommendation/RecommendationEventLogResponseDto.java
package com.team.backend.api.dto.recommendation;

import com.team.backend.domain.log.RecommendationEventLog;
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

// RecommendationEventLogResponseDto.java

public static RecommendationEventLogResponseDto from(RecommendationEventLog e) {
    return RecommendationEventLogResponseDto.builder()
            .id(e.getId())
            .createdAt(e.getCreatedAt())
            .userId(e.getUserId())
            .sessionId(e.getSessionKey())   // 엔티티: sessionKey(String) -> DTO: sessionId(String)
            .recommendationId(null)         // 엔티티에 컬럼 없음(현재는 null 유지가 맞음)
            .eventType(e.getEventType())
            .payloadJson(e.getPayload())    // 엔티티 payload(jsonb String) -> payloadJson
            .build();
}
}