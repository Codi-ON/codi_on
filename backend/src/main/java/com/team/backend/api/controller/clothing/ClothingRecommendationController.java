// src/main/java/com/team/backend/api/controller/clothing/ClothingRecommendationController.java
package com.team.backend.api.controller.clothing;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.service.recommendation.ClothingRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ClothingRecommendationController.API_PREFIX)
@RequiredArgsConstructor
public class ClothingRecommendationController {

    public static final String API_PREFIX = "/api/recommend";

    @GetMapping("/today")
    public ApiResponse<List<ClothingItemResponseDto>> today(
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
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
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
            @RequestParam ClothingCategory category,
            @RequestParam(defaultValue = "Seoul") String region,
            @RequestParam(defaultValue = "37.5665") double lat,
            @RequestParam(defaultValue = "126.9780") double lon,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ApiResponse.success(
                clothingRecommendationService.recommendTodayByCategory(category, region, lat, lon, limit, sessionKey)
        );
    }

    private final ClothingRecommendationService clothingRecommendationService;
}