// src/main/java/com/team/backend/api/controller/admin/AdminRecommendationMetricsController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.repository.admin.DashboardRecommendationMetricsJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/recommendation-metrics")
public class AdminRecommendationMetricsController {

    private final DashboardRecommendationMetricsJdbcRepository repo;

    // GET /api/admin/recommendation-metrics/funnel?from=2025-12-12&to=2025-12-12
    @GetMapping("/funnel")
    public ApiResponse<Map<String, Object>> funnel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        TimeRanges.Range r = TimeRanges.kstDayRange(from, to);

        var c = repo.fetchFunnelCounts(r.fromInclusive(), r.toExclusive());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("fromInclusive", r.fromInclusive());
        out.put("toExclusive", r.toExclusive());

        out.put("checklistSubmitted", c.getChecklistSubmitted());
        out.put("recoGenerated", c.getRecoGenerated());
        out.put("recoShown", c.getRecoShown());
        out.put("itemSelected", c.getItemSelected());
        out.put("feedbackSubmitted", c.getFeedbackSubmitted());
        out.put("recoCompleted", c.getRecoCompleted());

        out.put("checklistToShownRate", c.checklistToShownRate());
        out.put("shownToSelectRate", c.shownToSelectRate());
        out.put("selectToFeedbackRate", c.selectToFeedbackRate());
        out.put("shownToFeedbackRate", c.shownToFeedbackRate());

        return ApiResponse.success(out);
    }
}