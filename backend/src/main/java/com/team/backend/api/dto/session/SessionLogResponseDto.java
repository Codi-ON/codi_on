// src/main/java/com/team/backend/api/dto/session/SessionLogResponseDto.java
package com.team.backend.api.dto.session;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionLogResponseDto {

    private Long id;
    private OffsetDateTime createdAt;
    private Long userId;
    private String sessionKey;
    private String eventType;

    /**
     * jsonb(payload)를 text로 꺼낸 값
     */
    private String payloadJson;
}