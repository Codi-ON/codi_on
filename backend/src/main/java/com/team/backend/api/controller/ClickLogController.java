package com.team.backend.api.controller;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.recommendation.ItemClickLogRequestDto;
import com.team.backend.service.ClickLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class ClickLogController {

    private final ClickLogService clickLogService;

    /**
     * 추천 카드/아이템 클릭 로그 적재용 엔드포인트
     *
     * 예시 호출:
     * POST /api/logs/click
     * {
     *   "userId": 1,
     *   "sessionId": "550e8400-e29b-41d4-a716-446655440000",
     *   "recommendationId": 10,
     *   "clothingItemId": 1012,
     *   "eventType": "CLICK_ITEM",
     *   "payloadJson": "{\"source\":\"TODAY\",\"position\":1}"
     * }
     */
    @PostMapping("/click")
    public ApiResponse<Void> logClick(@RequestBody ItemClickLogRequestDto request) {
        clickLogService.logClick(request);
        return ApiResponse.success(null);
    }
}