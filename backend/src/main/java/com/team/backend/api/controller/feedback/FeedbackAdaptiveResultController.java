// src/main/java/com/team/backend/api/controller/feedback/FeedbackAdaptiveResultController.java
package com.team.backend.api.controller.feedback;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.feedback.FeedbackAdaptiveMonthlyResultResponseDto;
import com.team.backend.service.ai.service.FeedbackAdaptiveMonthlyResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/feedback/adaptive")
public class FeedbackAdaptiveResultController {

    private static final String SESSION_KEY_HEADER = "X-Session-Key";

    private final FeedbackAdaptiveMonthlyResultService feedbackAdaptiveMonthlyResultService;

    @GetMapping("/result")
    public ApiResponse<FeedbackAdaptiveMonthlyResultResponseDto> getMonthlyResult(
            @RequestHeader(SESSION_KEY_HEADER) String sessionKey,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ApiResponse.success("월말 학습 결과 조회 성공",
                feedbackAdaptiveMonthlyResultService.getMonthlyResult(sessionKey, year, month)
        );
    }
}