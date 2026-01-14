// src/main/java/com/team/backend/api/controller/feedback/FeedbackAdaptiveController.java
package com.team.backend.api.controller.feedback;

import com.team.backend.service.ai.FeedbackAdaptiveService;
import com.team.backend.service.ai.dto.FeedbackAdaptiveAiDto;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/feedback")
public class FeedbackAdaptiveController {

    private final FeedbackAdaptiveService feedbackAdaptiveService;

    @PostMapping("/adaptive")
    public FeedbackAdaptiveAiDto.AdaptiveResponse adaptive(
            @RequestHeader("X-Session-Key") String sessionKey,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestBody FeedbackAdaptiveAiDto.AdaptiveRequest request
    ) {
        return feedbackAdaptiveService.adaptive(sessionKey, year, month, request);
    }
}