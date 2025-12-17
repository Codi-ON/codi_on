// src/main/java/com/team/backend/api/controller/admin/AdminDashboardController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.click.DashboardClicksResponse;
import com.team.backend.api.dto.session.SessionLogResponseDto;
import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import com.team.backend.service.admin.SessionLogAdminService;
import com.team.backend.service.admin.SessionMetricsAdminService;
import com.team.backend.service.click.DashboardClicksService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.format.annotation.DateTimeFormat.ISO;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin") // ✅ /admin 완전삭제
public class AdminDashboardController {

    private static final int DEFAULT_LIMIT = 100;

    private final SessionLogAdminService sessionLogAdminService;
    private final SessionMetricsAdminService sessionMetricsAdminService;
    private final DashboardClicksService dashboardClicksService;

    // ==============================
    // 1) Session Metrics (Dashboard)
    // GET /api/admin/session-metrics/dashboard?from=2025-12-01&to=2025-12-03
    // ==============================
    @GetMapping("/session-metrics/dashboard")
    public ApiResponse<SessionMetricsDashboardResponseDto> getSessionMetricsDashboard(
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate to
    ) {
        return ApiResponse.success(sessionMetricsAdminService.getDashboard(from, to));
    }

    // ==============================
    // 2) Session Logs (Recent)
    // GET /api/admin/session-logs/recent?limit=50
    // ==============================
    @GetMapping("/session-logs/recent")
    public ApiResponse<List<SessionLogResponseDto>> getRecentSessionLogs(
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ApiResponse.success(sessionLogAdminService.getRecent(limit));
    }

    // ==============================
    // 3) Session Logs (Range)
    // GET /api/admin/session-logs/range?from=2025-12-01&to=2025-12-03&limit=100
    // ==============================
    @GetMapping("/session-logs/range")
    public ApiResponse<List<SessionLogResponseDto>> getSessionLogsRange(
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "" + DEFAULT_LIMIT) int limit
    ) {
        return ApiResponse.success(sessionLogAdminService.getRange(from, to, limit));
    }

    // ==============================
    // 4) Dashboard Clicks
    // GET /api/admin/dashboard/clicks?from=2025-12-01&to=2025-12-03&topN=10
    // ✅ region 제거 (서울 고정/불필요)
    // ==============================
    @GetMapping("/dashboard/clicks")
    public ApiResponse<DashboardClicksResponse> getDashboardClicks(
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int topN
    ) {
        return ApiResponse.success(dashboardClicksService.getDashboardClicks(from, to, topN));
    }
}