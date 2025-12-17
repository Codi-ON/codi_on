// src/main/java/com/team/backend/api/dto/session/SessionHourlyUsageResponseDto.java
package com.team.backend.api.dto.session;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionHourlyUsageResponseDto {

    // 0 ~ 23 시
    private int hour;

    // 해당 시각대 세션 수
    private long sessionCount;
}