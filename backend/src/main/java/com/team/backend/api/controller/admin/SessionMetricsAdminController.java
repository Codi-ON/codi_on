// src/main/java/com/team/backend/api/controller/admin/SessionMetricsAdminController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import com.team.backend.service.admin.SessionMetricsAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping(SessionMetricsAdminController.API_PREFIX)
@RequiredArgsConstructor
public class SessionMetricsAdminController {

    // ============================
    // 공통 URL prefix / param 상수
    // ============================
    public static final String API_PREFIX   = "/api/admin/session-metrics";
    public static final String PATH_DASHBOARD = "/dashboard";

    public static final String PARAM_FROM = "from";
    public static final String PARAM_TO   = "to";

    // 기본 조회 기간: 최근 7일
    private static final int DEFAULT_RANGE_DAYS = 7;

    private final SessionMetricsAdminService sessionMetricsAdminService;

    /**
     * 관리자 대시보드용 세션 지표 조회
     * - GET /api/admin/session-metrics/dashboard
     * - from / to 가 없으면 "최근 7일" 기준으로 조회
     */
    @GetMapping(PATH_DASHBOARD)
    public ApiResponse<SessionMetricsDashboardResponseDto> getDashboard(
            @RequestParam(name = PARAM_FROM, required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime from,

            @RequestParam(name = PARAM_TO, required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime to
    ) {
        // 기본값: to = 지금, from = to - 7일
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime resolvedTo   = (to   == null) ? now : to;
        OffsetDateTime resolvedFrom = (from == null) ? resolvedTo.minusDays(DEFAULT_RANGE_DAYS) : from;

        // from > to 로 들어오면 그냥 swap해서 방어
        if (resolvedFrom.isAfter(resolvedTo)) {
            OffsetDateTime tmp = resolvedFrom;
            resolvedFrom = resolvedTo;
            resolvedTo = tmp;
        }

        SessionMetricsDashboardResponseDto dto =
                sessionMetricsAdminService.getDashboard(resolvedFrom, resolvedTo);

        return ApiResponse.success(dto);
    }
}