package com.team.backend.api.controller.outfit;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.outfit.OutfitFeedbackRequestDto;
import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.service.outfit.OutfitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/outfits")
public class OutfitController {

    private static final String SESSION_HEADER = "X-Session-Key";

    private final OutfitService outfitService;

    // 오늘 저장
    @PostMapping("/today")
    public ApiResponse<OutfitResponseDto.Today> saveToday(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @Valid @RequestBody OutfitRequestDto.SaveToday req
    ) {
        return ApiResponse.success(outfitService.saveToday(sessionKey, req));
    }

    // 오늘 조회
    @GetMapping("/today")
    public ApiResponse<OutfitResponseDto.Today> getToday(
            @RequestHeader(SESSION_HEADER) String sessionKey
    ) {
        return ApiResponse.success(outfitService.getToday(sessionKey));
    }

    // 월 히스토리(캘린더)
    @GetMapping("/monthly")
    public ApiResponse<OutfitResponseDto.MonthlyHistory> getMonthly(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ApiResponse.success(outfitService.getMonthlyHistory(sessionKey, year, month));
    }

    // 오늘 피드백
    @PostMapping("/today/feedback")
    public ApiResponse<OutfitResponseDto.Today> submitTodayFeedback(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @Valid @RequestBody OutfitFeedbackRequestDto req
    ) {
        return ApiResponse.success(outfitService.submitTodayFeedback(sessionKey, req.getRating()));
    }
}