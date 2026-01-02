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

    @PostMapping("/today")
    public ApiResponse<OutfitResponseDto.Today> saveToday(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @Valid @RequestBody OutfitRequestDto.SaveToday req
    ) {
        return ApiResponse.success(outfitService.saveToday(sessionKey, req));
    }


    @GetMapping("/today")
    public ApiResponse<OutfitResponseDto.Today> getToday(
            @RequestHeader(SESSION_HEADER) String sessionKey
    ) {
        return ApiResponse.success(outfitService.getToday(sessionKey));
    }


    @GetMapping("/monthly")
    public ApiResponse<OutfitResponseDto.MonthlyHistory> getMonthlyHistory(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ApiResponse.success(outfitService.getMonthlyHistory(sessionKey, year, month));
    }


    @PostMapping("/{date}/feedback")
    public ApiResponse<OutfitResponseDto.Today> submitFeedbackByDate(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody OutfitFeedbackRequestDto req
    ) {
        return ApiResponse.success(outfitService.submitFeedbackOnce(sessionKey, date, req.getRating()));
    }


    @PostMapping("/today/feedback")
    public ApiResponse<OutfitResponseDto.Today> submitTodayFeedback(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @Valid @RequestBody OutfitFeedbackRequestDto req
    ) {
        return ApiResponse.success(outfitService.submitTodayFeedback(sessionKey, req.getRating()));
    }
}