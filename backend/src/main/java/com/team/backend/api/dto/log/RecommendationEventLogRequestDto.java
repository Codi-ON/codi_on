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
@Builder
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

    public RecommendationEventLogRequestDto fillSessionKeyIfMissing(String headerSessionKey) {
        if ((sessionKey == null || sessionKey.isBlank()) && headerSessionKey != null && !headerSessionKey.isBlank()) {
            this.sessionKey = headerSessionKey;
        }
        return this;
    }

    public String payloadJsonOrNull() {
        if (payload == null) return null;
        try { return OM.writeValueAsString(payload); }
        catch (JsonProcessingException e) { return "{\"payloadSerializeError\":true}"; }
    }
}