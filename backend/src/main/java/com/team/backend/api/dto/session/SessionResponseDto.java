// src/main/java/com/team/backend/api/dto/session/SessionResponseDto.java
package com.team.backend.api.dto.session;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponseDto {
    private String sessionKey;

    public static SessionResponseDto of(String sessionKey) {
        return SessionResponseDto.builder()
                .sessionKey(sessionKey)
                .build();
    }
}