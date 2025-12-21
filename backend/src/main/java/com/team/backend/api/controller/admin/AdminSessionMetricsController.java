// src/main/java/com/team/backend/api/controller/admin/AdminSessionMetricsController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.service.admin.SessionMetricsAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/session-metrics")
@RequiredArgsConstructor
public class AdminSessionMetricsController {

    private final SessionMetricsAdminService sessionMetricsAdminService;

    @GetMapping
    public ApiResponse<SessionMetricsDashboardResponseDto> getDashboard(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        TimeRanges.Range range = TimeRanges.kstDayRange(from, to);

        SessionMetricsDashboardResponseDto result =
                sessionMetricsAdminService.getDashboard(range.fromInclusive(), range.toExclusive());

        return ApiResponse.success("OK", result);
    }
}