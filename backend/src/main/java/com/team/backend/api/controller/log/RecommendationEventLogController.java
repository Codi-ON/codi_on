// src/main/java/com/team/backend/api/controller/log/RecommendationEventLogController.java
package com.team.backend.api.controller.log;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.service.log.RecommendationEventLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/logs/reco")
public class RecommendationEventLogController {

    private static final String SESSION_KEY_HEADER = "X-Session-Key";

    private final RecommendationEventLogService service;

    @PostMapping
    public ApiResponse<Void> write(
            @RequestBody @Valid RecommendationEventLogRequestDto request,
            @RequestHeader(value = SESSION_KEY_HEADER, required = false) String sessionKeyHeader
    ) {
        // DTO가 mutable이면 fill로 처리
        request.fillSessionKeyIfMissing(sessionKeyHeader);

        service.write(request);
        return ApiResponse.success("추천 이벤트 로그가 저장되었습니다.", null);
    }
}