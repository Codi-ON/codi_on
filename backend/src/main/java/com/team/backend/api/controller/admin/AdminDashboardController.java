// src/main/java/com/team/backend/api/controller/admin/AdminDashboardController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.admin.dashboard.DashboardMonthlyResponseDto;
import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.service.admin.DashboardMonthlyAdminService;
import com.team.backend.service.admin.DashboardOverviewAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private static final int DEFAULT_TOP_N = 10;
    private static final int MIN_TOP_N = 1;
    private static final int MAX_TOP_N = 50;

    private final DashboardOverviewAdminService dashboardOverviewAdminService;
    private final DashboardMonthlyAdminService dashboardMonthlyAdminService;

    @GetMapping("/overview")
    public ApiResponse<DashboardOverviewResponseDto> overview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "" + DEFAULT_TOP_N) int topN
    ) {
        int resolvedTopN = clamp(topN, MIN_TOP_N, MAX_TOP_N);
        return ApiResponse.success(dashboardOverviewAdminService.getOverview(from, to, resolvedTopN));
    }

    @GetMapping("/monthly")
    public ApiResponse<DashboardMonthlyResponseDto> monthly(
            @RequestParam String fromMonth,
            @RequestParam String toMonth,
            @RequestParam(defaultValue = "" + DEFAULT_TOP_N) int topN
    ) {
        YearMonth fromYm = TimeRanges.parseYearMonthLenient(fromMonth);
        YearMonth toYm   = TimeRanges.parseYearMonthLenient(toMonth);

        if (fromYm.isAfter(toYm)) throw new IllegalArgumentException("fromMonth는 toMonth보다 클 수 없습니다.");
        int resolvedTopN = clamp(topN, MIN_TOP_N, MAX_TOP_N);

        return ApiResponse.success(dashboardMonthlyAdminService.getMonthly(fromYm, toYm, resolvedTopN));
    }

    @GetMapping("/monthly/excel")
    public ResponseEntity<byte[]> monthlyExcel(
            @RequestParam String fromMonth,
            @RequestParam String toMonth,
            @RequestParam(defaultValue = "" + DEFAULT_TOP_N) int topN
    ) {
        YearMonth fromYm = TimeRanges.parseYearMonthLenient(fromMonth);
        YearMonth toYm   = TimeRanges.parseYearMonthLenient(toMonth);

        if (fromYm.isAfter(toYm)) throw new IllegalArgumentException("fromMonth는 toMonth보다 클 수 없습니다.");
        int resolvedTopN = clamp(topN, MIN_TOP_N, MAX_TOP_N);

        var export = dashboardMonthlyAdminService.exportMonthlyExcel(fromYm, toYm, resolvedTopN);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + export.filename() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, export.contentType())
                .body(export.bytes());
    }

    private static int clamp(int v, int min, int max) {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }
}