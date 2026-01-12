// src/main/java/com/team/backend/api/controller/outfit/OutfitController.java
package com.team.backend.api.controller.outfit;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.outfit.OutfitFeedbackRequestDto;
import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.service.outfit.OutfitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/outfits")
public class OutfitController {

    private static final String SESSION_HEADER = "X-Session-Key";

    private final OutfitService outfitService;

    /**
     * 오늘 아웃핏 저장 (덮어쓰기)
     * POST /api/outfits/today
     * Header: X-Session-Key
     * Body: OutfitRequestDto.SaveToday
     */
    @PostMapping("/today")
    public ApiResponse<OutfitResponseDto.Today> saveToday(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @Valid @RequestBody OutfitRequestDto.SaveToday req
    ) {
        return ApiResponse.success(outfitService.saveToday(sessionKey, req));
    }

    /**
     * 오늘 아웃핏 조회
     * GET /api/outfits/today
     * Header: X-Session-Key
     */
    @GetMapping("/today")
    public ApiResponse<OutfitResponseDto.Today> getToday(
            @RequestHeader(SESSION_HEADER) String sessionKey
    ) {
        return ApiResponse.success(outfitService.getToday(sessionKey));
    }

    /**
     * 월간 히스토리 조회
     * GET /api/outfits/monthly?year=YYYY&month=MM
     * Header: X-Session-Key
     */
    @GetMapping("/monthly")
    public ApiResponse<OutfitResponseDto.MonthlyHistory> getMonthlyHistory(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ApiResponse.success(outfitService.getMonthlyHistory(sessionKey, year, month));
    }

    /**
     * 날짜별 피드백 제출(1회 제한)
     * POST /api/outfits/{date}/feedback
     * Header: X-Session-Key
     */
    @PostMapping("/{date}/feedback")
    public ApiResponse<OutfitResponseDto.Today> submitFeedbackByDate(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody OutfitFeedbackRequestDto req
    ) {
        return ApiResponse.success(outfitService.submitFeedbackOnce(sessionKey, date, req.getRating()));
    }

    /**
     * 오늘 피드백 제출(날짜 alias)
     * POST /api/outfits/today/feedback
     * Header: X-Session-Key
     */
    @PostMapping("/today/feedback")
    public ApiResponse<OutfitResponseDto.Today> submitTodayFeedback(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @Valid @RequestBody OutfitFeedbackRequestDto req
    ) {
        return ApiResponse.success(outfitService.submitTodayFeedback(sessionKey, req.getRating()));
    }
}