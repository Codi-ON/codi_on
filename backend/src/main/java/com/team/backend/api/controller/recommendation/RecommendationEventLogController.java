// src/main/java/com/team/backend/api/controller/RecommendationEventLogController.java
package com.team.backend.api.controller.recommendation;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.recommendation.RecommendationEventLogResponseDto;
import com.team.backend.service.recommendation.RecommendationEventLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/recommendation-logs")
@RequiredArgsConstructor
public class RecommendationEventLogController {

    private final RecommendationEventLogService recommendationEventLogService;

    private static final int DEFAULT_LIMIT = 100;
    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 500;

    /**
     * 최근 추천 이벤트 로그 조회
     *
     * 예)
     *  - GET /api/admin/recommendation-logs/recent
     *  - GET /api/admin/recommendation-logs/recent?limit=50
     */
    @GetMapping("/recent")
    public ApiResponse<List<RecommendationEventLogResponseDto>> getRecent(
            @RequestParam(name = "limit", required = false) Integer limit
    ) {
        int resolved = resolveLimit(limit);
        List<RecommendationEventLogResponseDto> rows =
                recommendationEventLogService.getRecent(resolved);
        return ApiResponse.success(rows);
    }

    /**
     * 기간 기준 추천 이벤트 로그 조회
     *
     * 예)
     *  - GET /api/admin/recommendation-logs/range
     *        ?from=2025-12-01T00:00:00+09:00
     *        &to=2025-12-31T23:59:59+09:00
     *        &limit=200
     */
    @GetMapping("/range")
    public ApiResponse<List<RecommendationEventLogResponseDto>> getByCreatedAtBetween(
            @RequestParam("from")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime from,
            @RequestParam("to")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime to,
            @RequestParam(name = "limit", required = false) Integer limit
    ) {
        int resolved = resolveLimit(limit);
        List<RecommendationEventLogResponseDto> rows =
                recommendationEventLogService.getByCreatedAtBetween(from, to, resolved);
        return ApiResponse.success(rows);
    }

    // ======================
    // 내부 공통 limit 처리
    // ======================
    private int resolveLimit(Integer limit) {
        int v = (limit == null ? DEFAULT_LIMIT : limit);
        if (v < MIN_LIMIT) v = MIN_LIMIT;
        if (v > MAX_LIMIT) v = MAX_LIMIT;
        return v;
    }
}