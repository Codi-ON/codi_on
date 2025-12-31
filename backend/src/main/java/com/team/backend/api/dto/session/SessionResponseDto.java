// src/main/java/com/team/backend/api/dto/session/SessionResponseDto.java
package com.team.backend.api.dto.session;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResponseDto {
    private String sessionKey;

    public static SessionResponseDto of(String sessionKey) {
        return SessionResponseDto.builder().sessionKey(sessionKey).build();
    }
}