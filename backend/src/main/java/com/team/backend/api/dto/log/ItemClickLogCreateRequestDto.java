package com.team.backend.api.dto.log;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemClickLogCreateRequestDto {

    private OffsetDateTime createdAt;
    private Long userId;

    @NotBlank
    private String sessionKey;

    // (기존 호환 유지) - 과거 BIGINT recommendationId
    private Long recommendationId;


    private UUID recommendationUuid;

    @NotNull
    private Long clothingItemId;

    @NotBlank
    private String eventType;

    // ✅ 최소 키는 payload에 넣을 것: funnelStep, page, ui
    private Map<String, Object> payload;

    private static final ObjectMapper OM = new ObjectMapper();

    public ItemClickLogCreateRequestDto fillSessionKeyIfMissing(String headerSessionKey) {
        if ((sessionKey == null || sessionKey.isBlank()) && headerSessionKey != null && !headerSessionKey.isBlank()) {
            this.sessionKey = headerSessionKey;
        }
        return this;
    }

    /** payload null이면 빈 맵으로 보정 */
    public Map<String, Object> payloadOrEmpty() {
        if (payload == null) return new LinkedHashMap<>();
        return new LinkedHashMap<>(payload);
    }

    public String payloadJsonOrNull() {
        if (payload == null) return null;
        try { return OM.writeValueAsString(payload); }
        catch (JsonProcessingException e) { return "{\"payloadSerializeError\":true}"; }
    }
}