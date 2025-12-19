// src/main/java/com/team/backend/api/controller/admin/AdminDashboardController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.admin.dashboard.DashboardMonthlyResponseDto;
import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.api.dto.click.DashboardClicksResponse;
import com.team.backend.service.admin.DashboardMonthlyAdminService;
import com.team.backend.service.admin.DashboardOverviewAdminService;
import com.team.backend.service.click.DashboardClicksService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final DashboardOverviewAdminService dashboardOverviewAdminService;
    private final DashboardClicksService dashboardClicksService;
    private final DashboardMonthlyAdminService dashboardMonthlyAdminService;

    // GET /api/admin/dashboard/overview?from=2025-12-01&to=2025-12-31&topN=10
    @GetMapping("/overview")
    public ApiResponse<DashboardOverviewResponseDto> overview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int topN
    ) {
        return ApiResponse.success(dashboardOverviewAdminService.getOverview(from, to, topN));
    }

    // GET /api/admin/dashboard/clicks?from=2025-12-01&to=2025-12-31&topN=10
    @GetMapping("/clicks")
    public ApiResponse<DashboardClicksResponse> clicks(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int topN
    ) {
        return ApiResponse.success(dashboardClicksService.getDashboardClicks(from, to, topN));
    }
  // 1) JSON 조회
    @GetMapping("/monthly")
    public ApiResponse<DashboardMonthlyResponseDto> getMonthly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ApiResponse.success(dashboardMonthlyAdminService.getMonthly(from, to));
    }

    // 2) 엑셀 다운로드
    @GetMapping("/monthly/excel")
    public ResponseEntity<byte[]> downloadMonthlyExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        byte[] bytes = dashboardMonthlyAdminService.exportMonthlyExcel(from, to).bytes();

        String filename = "dashboard_monthly_" + from + "_to_" + to + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ))
                .body(bytes);
    }

}