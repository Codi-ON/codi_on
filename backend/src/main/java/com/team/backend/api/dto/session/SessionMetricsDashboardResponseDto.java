// src/main/java/com/team/backend/api/dto/session/SessionMetricsDashboardResponseDto.java
package com.team.backend.api.dto.session;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionMetricsDashboardResponseDto {

    // 상단 요약 카드
    private SessionMetricsSummaryResponseDto summary;

    // 일별 추이 (서비스에서 dailyTrend 라고 부르므로 필드명도 dailyTrend)
    private List<SessionDailyTrendResponseDto> dailyTrend;

    // 시간대별 사용량
    private List<SessionHourlyUsageResponseDto> hourlyUsage;
}