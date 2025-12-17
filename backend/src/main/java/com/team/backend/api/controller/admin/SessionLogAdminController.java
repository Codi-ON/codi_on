// src/main/java/com/team/backend/api/controller/admin/SessionLogAdminController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.session.SessionLogResponseDto;
import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import com.team.backend.domain.enums.log.SessionRangeType;
import com.team.backend.domain.session.SessionDateRange;
import com.team.backend.domain.session.SessionRangeResolver;
import com.team.backend.repository.SessionLogAdminService;
import com.team.backend.service.Sess;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/session-logs")
@RequiredArgsConstructor
public class SessionLogAdminController {

    private final SessionLogAdminService sessionLogAdminService;
    private final SessionMetricsAdminService sessionMetricsAdminService;

    @GetMapping("/recent")
    public ApiResponse<List<SessionLogResponseDto>> getRecent(
            @RequestParam(name = "limit", defaultValue = "100") int limit
    ) {
        return ApiResponse.success(sessionLogAdminService.getRecent(limit));
    }

    @GetMapping("/range")
    public ApiResponse<List<SessionLogResponseDto>> getByRange(
            @RequestParam("from")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime from,
            @RequestParam("to")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime to,
            @RequestParam(name = "limit", defaultValue = "200") int limit
    ) {
        return ApiResponse.success(
                sessionLogAdminService.getByCreatedAtBetween(from, to, limit)
        );
    }


    @GetMapping("/admin/session-metrics")
public ApiResponse<SessionMetricsDashboardResponseDto> getMetrics(
        @RequestParam(required = false) SessionRangeType rangeType,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
) {
    SessionDateRange range = SessionRangeResolver.resolve(rangeType, from, to);

    SessionMetricsDashboardResponseDto result =
            sessionMetricsAdminService.getDashboard(range.from(), range.to());

    return ApiResponse.success(result);
}
}