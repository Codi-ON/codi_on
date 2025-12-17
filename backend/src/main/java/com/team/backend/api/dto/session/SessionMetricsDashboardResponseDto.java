package com.team.backend.api.dto.session;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 관리자 세션 대시보드 전체 응답
 * - summary + dailyTrend + hourlyUsage 한 번에 내려줄 때 사용
 */
@Getter
@Builder
public class SessionMetricsDashboardResponseDto {

    /**
     * 기간 요약 지표
     */
    private final SessionMetricsSummaryResponseDto summary;

    /**
     * 일별 추이 데이터
     */
    private final List<SessionDailyTrendResponseDto> dailyTrend;

    /**
     * 시간대별 사용량 데이터
     */
    private final List<SessionHourlyUsageResponseDto> hourlyUsage;
}