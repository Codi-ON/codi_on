package com.team.backend.api.dto.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.domain.enums.session.SessionEventType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionLogRequestDto {

    private OffsetDateTime createdAt;

    private Long userId;

    /**
     * 정합성/조인용 키 (권장: 앞으로 이걸 기준으로 통일)
     */
    private UUID sessionId; // ✅ 추가

    /**
     * 사람이 읽는 추적용 키 (옵션)
     */
    private String sessionKey; // ✅ 이제 옵션로 두는 걸 권장

    @NotNull
    private SessionEventType eventType;

    private Long recommendationId;

    private Map<String, Object> payload;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @AssertTrue(message = "sessionId or sessionKey must be provided")
    public boolean hasSessionIdentifier() {
        return sessionId != null || (sessionKey != null && !sessionKey.isBlank());
    }

    public String getPayloadJson() {
        if (payload == null) return null;
        try {
            return OBJECT_MAPPER.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid session payload JSON", e);
        }
    }
}