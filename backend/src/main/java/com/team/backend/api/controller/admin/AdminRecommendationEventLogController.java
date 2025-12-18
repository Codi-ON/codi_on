// src/main/java/com/team/backend/api/controller/admin/AdminRecommendationEventLogController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.recommendation.RecommendationEventLogResponseDto;
import com.team.backend.service.recommendation.RecommendationEventLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.springframework.format.annotation.DateTimeFormat.ISO;

@RestController
@RequestMapping(AdminRecommendationEventLogController.API_PREFIX)
@RequiredArgsConstructor
public class AdminRecommendationEventLogController {

    // URL
    public static final String API_PREFIX = "/api/admin/recommendation-logs";
    public static final String PATH_RECENT = "/recent";
    public static final String PATH_RANGE  = "/range";

    // Param
    public static final String PARAM_FROM  = "from";
    public static final String PARAM_TO    = "to";
    public static final String PARAM_LIMIT = "limit";

    // Limit 정책
    private static final int DEFAULT_LIMIT = 100;
    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 500;

    // KST
    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    private final RecommendationEventLogService recommendationEventLogService;

    /**
     * GET /api/admin/recommendation-logs/recent?limit=50
     */
    @GetMapping(PATH_RECENT)
    public ApiResponse<List<RecommendationEventLogResponseDto>> getRecent(
            @RequestParam(name = PARAM_LIMIT, required = false) Integer limit
    ) {
        int resolved = resolveLimit(limit);
        return ApiResponse.success(recommendationEventLogService.getRecent(resolved));
    }

    /**
     * date-only로 받는게 안전함 (Swagger/프론트 모두)
     * GET /api/admin/recommendation-logs/range?from=2025-12-01&to=2025-12-31&limit=200
     */
    @GetMapping(PATH_RANGE)
    public ApiResponse<List<RecommendationEventLogResponseDto>> getRange(
            @RequestParam(PARAM_FROM) @DateTimeFormat(iso = ISO.DATE) LocalDate from,
            @RequestParam(PARAM_TO)   @DateTimeFormat(iso = ISO.DATE) LocalDate to,
            @RequestParam(name = PARAM_LIMIT, required = false) Integer limit
    ) {
        int resolved = resolveLimit(limit);

        OffsetDateTime fromAt = from.atStartOfDay().atOffset(KST);
        OffsetDateTime toAt   = to.plusDays(1).atStartOfDay().atOffset(KST).minusNanos(1);

        return ApiResponse.success(
                recommendationEventLogService.getByCreatedAtBetween(fromAt, toAt, resolved)
        );
    }

    private int resolveLimit(Integer limit) {
        int v = (limit == null ? DEFAULT_LIMIT : limit);
        if (v < MIN_LIMIT) v = MIN_LIMIT;
        if (v > MAX_LIMIT) v = MAX_LIMIT;
        return v;
    }
}