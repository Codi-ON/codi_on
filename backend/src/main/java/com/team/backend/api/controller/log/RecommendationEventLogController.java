// src/main/java/com/team/backend/api/controller/recommendation/RecommendationEventLogController.java
package com.team.backend.api.controller.log;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.recommendation.RecommendationEventLogResponseDto;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.service.recommendation.RecommendationEventLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recommendation/logs")
public class RecommendationEventLogController {

    private final RecommendationEventLogService service;

    @PostMapping
    public ApiResponse<Void> write(@RequestBody RecommendationEventLogRequestDto dto) {
        service.write(dto);
        return ApiResponse.success(null);
    }

    @GetMapping("/recent")
    public ApiResponse<List<RecommendationEventLogResponseDto>> recent(
            @RequestParam(required = false) Integer limit
    ) {
        return ApiResponse.success(service.recent(limit));
    }

    // ✅ 날짜만 받는다: /range?from=2025-12-12&to=2025-12-12
    @GetMapping("/range")
    public ApiResponse<List<RecommendationEventLogResponseDto>> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) List<RecommendationEventType> eventTypes,
            @RequestParam(required = false) Integer limit
    ) {
        TimeRanges.Range r = TimeRanges.kstDayRange(from, to);
        return ApiResponse.success(service.range(r.fromInclusive(), r.toExclusive(), eventTypes, limit));
    }
}