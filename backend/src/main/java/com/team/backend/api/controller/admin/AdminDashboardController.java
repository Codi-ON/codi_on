// src/main/java/com/team/backend/api/controller/admin/AdminDashboardController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.service.admin.DashboardOverviewAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final DashboardOverviewAdminService dashboardOverviewAdminService;

    @GetMapping("/overview")
    public ApiResponse<DashboardOverviewResponseDto> overview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int topN
    ) {
        return ApiResponse.success(dashboardOverviewAdminService.getOverview(from, to, topN));
    }
}