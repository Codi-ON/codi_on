// src/main/java/com/team/backend/api/dto/session/SessionMetricsSummaryResponseDto.java
package com.team.backend.api.dto.session;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionMetricsSummaryResponseDto {

    // 전체 세션 수
    private long totalSessions;

    // 유니크 유저 수
    private long uniqueUsers;

    // 유저당 평균 세션 수
    private BigDecimal avgSessionsPerUser;
}