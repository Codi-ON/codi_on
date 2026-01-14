// src/main/java/com/team/backend/api/dto/log/RecommendationEventLogRequestDto.java
package com.team.backend.api.dto.log;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class RecommendationEventLogRequestDto {

    private OffsetDateTime createdAt; // null이면 DB now()
    private Long userId;

    @NotBlank
    private String sessionKey;

    private UUID recommendationId;

    private String funnelStep;

    @NotBlank
    private String eventType;

    private Map<String, Object> payload;

    private static final ObjectMapper OM = new ObjectMapper();

    /**
     * Header sessionKey로 보정이 필요하면 "새 DTO"를 반환한다.
     * - 기존 객체를 mutate 하지 않는다.
     */
    public RecommendationEventLogRequestDto fillSessionKeyIfMissing(String headerSessionKey) {
        boolean missingBody = (sessionKey == null || sessionKey.isBlank());
        boolean hasHeader = (headerSessionKey != null && !headerSessionKey.isBlank());

        if (!missingBody || !hasHeader) return this;

        return this.toBuilder()
                .sessionKey(headerSessionKey)
                .build();
    }

    public String payloadJsonOrNull() {
        if (payload == null) return null;
        try {
            return OM.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{\"payloadSerializeError\":true}";
        }
    }
}