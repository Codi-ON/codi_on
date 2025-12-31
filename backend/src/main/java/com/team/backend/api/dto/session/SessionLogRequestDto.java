// src/main/java/com/team/backend/api/dto/session/SessionLogRequestDto.java
package com.team.backend.api.dto.session;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.domain.enums.session.SessionEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionLogRequestDto {

    /**
     * 이벤트가 실제로 발생한 시각(옵션)
     * - null이면 서버에서 now()로 채움
     * - DB: occurred_at 로 들어감
     */
    private OffsetDateTime occurredAt;

    /**
     * 현재 DB/FK 구조에서는 sessionKey가 "유일 식별자"
     * - 반드시 UUID v4 문자열이 들어와야 함 (SessionService.validateOnly로 검증 권장)
     */
    @NotBlank(message = "sessionKey is required")
    private String sessionKey;

    @NotNull
    private SessionEventType eventType;

    private Long userId;             // 옵션(지금 테이블에 없으면 저장 안 함)
    private Long recommendationId;   // 옵션(지금 테이블에 없으면 저장 안 함)

    private Map<String, Object> payload;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @JsonIgnore
    public String getPayloadJson() {
        if (payload == null) return null;
        try {
            return OBJECT_MAPPER.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid session payload JSON", e);
        }
    }
}