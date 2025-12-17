// src/main/java/com/team/backend/api/dto/session/SessionMetricsDashboardResponseDto.java
package com.team.backend.api.dto.session;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 세션 지표 대시보드 응답 DTO
 *  - 요약 지표
 *  - 일별 추이
 *  - 시간대별 사용량
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionMetricsDashboardResponseDto {

    // 상단 카드 요약: 전체 세션 수, 유니크 유저 수, 유저당 평균 세션 수
    private SessionMetricsSummaryResponseDto summary;

    // 일별 세션 수 / 유니크 유저 수
    private List<SessionDailyTrendResponseDto> dailyTrend;

    // 시간대별 세션 수 (0 ~ 23시)
    private List<SessionHourlyUsageResponseDto> hourlyUsage;
}