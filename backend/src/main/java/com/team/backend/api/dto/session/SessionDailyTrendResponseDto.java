// src/main/java/com/team/backend/api/dto/session/SessionDailyTrendResponseDto.java
package com.team.backend.api.dto.session;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionDailyTrendResponseDto {

    // 날짜 (KST 기준)
    private LocalDate date;

    // 해당 날짜의 세션 수
    private long sessionCount;

    // 해당 날짜의 유니크 유저 수
    private long uniqueUserCount;
}