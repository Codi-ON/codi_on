// src/main/java/com/team/backend/api/controller/feedback/FeedbackAdaptiveController.java
package com.team.backend.api.controller.feedback;

import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.service.ai.FeedbackAdaptiveService;
import com.team.backend.service.ai.dto.FeedbackAdaptiveAiDto;
import com.team.backend.service.log.RecommendationEventLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/feedback")
public class FeedbackAdaptiveController {

    private static final String FUNNEL_STEP_FEEDBACK_ADAPTIVE = "FEEDBACK_ADAPTIVE";

    private final FeedbackAdaptiveService feedbackAdaptiveService;
    private final RecommendationEventLogService recommendationEventLogService;

    @PostMapping("/adaptive")
    public FeedbackAdaptiveAiDto.AdaptiveResponse adaptive(
            @RequestHeader("X-Session-Key") String sessionKey,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestBody FeedbackAdaptiveAiDto.AdaptiveRequest request
    ) {
        if (request == null) throw new IllegalArgumentException("request is required");

        UUID feedbackId = UUID.randomUUID();
        request.feedbackId = feedbackId;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("feedbackId", feedbackId.toString());
        payload.put("year", year);
        payload.put("month", month);
        payload.put("requestModels", request.requestModels);
        payload.put("samplesCount", (request.samples == null) ? 0 : request.samples.size());
        payload.put("range", request.range);
        payload.put("prevBias", request.prevBias);

        recommendationEventLogService.write(
                RecommendationEventLogRequestDto.builder()
                        .createdAt(null) // DB now()
                        .userId(null)
                        .sessionKey(sessionKey)
                        .recommendationId(feedbackId)
                        .funnelStep(FUNNEL_STEP_FEEDBACK_ADAPTIVE)
                        .eventType(RecommendationEventType.FEEDBACK_ADAPTIVE_REQUESTED.name())
                        .payload(payload)
                        .build()
        );

        // 3) 서비스에서 SUCCEEDED / FAILED 로깅
        return feedbackAdaptiveService.adaptive(sessionKey, year, month, request);
    }
}