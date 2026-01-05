// src/main/java/com/team/backend/api/controller/clothing/ClothingRecommendationController.java
package com.team.backend.api.controller.clothing;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.api.dto.recommendation.RecommendationCandidatesRequestDto;
import com.team.backend.api.dto.recommendation.RecommendationCandidatesResponseDto;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.service.recommendation.ClothingRecommendationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping(ClothingRecommendationController.API_PREFIX)
@RequiredArgsConstructor
public class ClothingRecommendationController {

    public static final String API_PREFIX = "/api/recommend";
    private static final String SESSION_HEADER = "X-Session-Key";

    private final ClothingRecommendationService clothingRecommendationService;

    // =========================
    // 기존: 오늘 추천 (sessionKey optional → null이면 전체풀 fallback은 서비스에서 처리)
    // =========================
    @GetMapping("/today")
    public ApiResponse<List<ClothingItemResponseDto>> today(
            @RequestHeader(value = SESSION_HEADER, required = false) String sessionKey,
            @RequestParam(defaultValue = "Seoul") String region,
            @RequestParam(defaultValue = "37.5665") double lat,
            @RequestParam(defaultValue = "126.9780") double lon,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ApiResponse.success(
                clothingRecommendationService.recommendToday(region, lat, lon, limit, sessionKey)
        );
    }

    @GetMapping("/today/by-category")
    public ApiResponse<List<ClothingItemResponseDto>> todayByCategory(
            @RequestHeader(value = SESSION_HEADER, required = false) String sessionKey,
            @RequestParam ClothingCategory category,
            @RequestParam(defaultValue = "Seoul") String region,
            @RequestParam(defaultValue = "37.5665") double lat,
            @RequestParam(defaultValue = "126.9780") double lon,
            @RequestParam(defaultValue = "50") int limit
    ) {
            System.out.println("HIT /today/by-category category=" + category + ", region=" + region + ", lat=" + lat + ", lon=" + lon + ", limit=" + limit);
        return ApiResponse.success(
                clothingRecommendationService.recommendTodayByCategory(category, region, lat, lon, limit, sessionKey)
        );
    }

    // =========================
    // 신규: 후보풀 생성
    // - 정책: candidates는 세션키 필수(옷장 기반이 기본)
    // - 검증: @NotBlank로 400 자동 처리 (GlobalExceptionHandler가 MethodArgumentNotValid/ConstraintViolation 처리)
    // =========================
    @PostMapping("/candidates")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<RecommendationCandidatesResponseDto> candidates(
            @RequestHeader(value = SESSION_HEADER) @NotBlank(message = "X-Session-Key is required") String sessionKey,
            @Valid @RequestBody RecommendationCandidatesRequestDto req
    ) {
        return ApiResponse.success(
                clothingRecommendationService.getCandidates(req, sessionKey)
        );
    }
}