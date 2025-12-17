// src/main/java/com/team/backend/api/dto/session/SessionLogRequestDto.java
package com.team.backend.api.dto.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;

import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionLogRequestDto {

    private Long userId;

    @NonNull
    private String sessionKey;   // 필수

    @NonNull
    private String eventType;    // 필수 (e.g. "ENTER_HOME", "VIEW_RECO", "LOGOUT")

    /**
     * 자유 형태 메타데이터 (화면, 디바이스, 진입 경로 등)
     * - JSONB로 저장할 예정
     */
    private Map<String, Object> payload;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /**
     * DB insert용 JSON 문자열
     * - payload == null 이면 null
     * - JSON 직렬화 실패 시 바로 예외 던져서 조기 발견
     */
    public String getPayloadJson() {
        if (payload == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid session payload JSON", e);
        }
    }
}