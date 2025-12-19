package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.api.dto.click.DashboardClicksResponse;
import com.team.backend.service.admin.DashboardOverviewAdminService;
import com.team.backend.service.click.DashboardClicksService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.format.annotation.DateTimeFormat.ISO;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private static final int DEFAULT_TOP_N = 10;
    private static final int MIN_TOP_N = 1;
    private static final int MAX_TOP_N = 50;

    private final DashboardOverviewAdminService dashboardOverviewAdminService;
    private final DashboardClicksService dashboardClicksService;

    @GetMapping("/overview")
    public ApiResponse<DashboardOverviewResponseDto> overview(
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "" + DEFAULT_TOP_N) int topN
    ) {
        if (from.isAfter(to)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "from은 to보다 이후일 수 없습니다. (from=" + from + ", to=" + to + ")"
            );
        }
        int resolvedTopN = clamp(topN, MIN_TOP_N, MAX_TOP_N);
        return ApiResponse.success(dashboardOverviewAdminService.getOverview(from, to, resolvedTopN));
    }

    @GetMapping("/clicks")
    public ApiResponse<DashboardClicksResponse> clicks(
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "" + DEFAULT_TOP_N) int topN
    ) {
        if (from.isAfter(to)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "from은 to보다 이후일 수 없습니다. (from=" + from + ", to=" + to + ")"
            );
        }
        int resolvedTopN = clamp(topN, MIN_TOP_N, MAX_TOP_N);
        return ApiResponse.success(dashboardClicksService.getDashboardClicks(from, to, resolvedTopN));
    }

    private static int clamp(int v, int min, int max) {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }
}