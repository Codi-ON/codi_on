// src/main/java/com/team/backend/api/dto/recommendation/ItemClickLogRequestDto.java
package com.team.backend.api.dto.recommendation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemClickLogRequestDto {

    // DB created_at 과 매핑 (nullable, null이면 now() 사용)
    private OffsetDateTime createdAt;

    private Long userId;
    private UUID sessionId;
    private Long recommendationId;
    private Long clothingItemId;
    private String eventType;

    /**
     * 요청에서 들어오는 자유형 JSON
     *  - swagger 에서는 object 형태로 받기
     */
    private Map<String, Object> payload;

    // ------------------------
    // DB insert용 JSON 문자열 헬퍼
    // ------------------------
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /**
     * DB insert 용 JSON 문자열로 변환해서 넘겨주는 헬퍼
     *  - payload 가 null 이면 null 리턴
     *  - 직렬화 오류 시 IllegalArgumentException 던져서 바로 확인
     */
    public String getPayloadJson() {
        if (payload == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid payload JSON", e);
        }
    }
}