package com.team.backend.api.controller;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.domain.ClothingCategory;
import com.team.backend.domain.ClothingItem;
import com.team.backend.service.ClothingRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommend")
@RequiredArgsConstructor
public class ClothingRecommendationController {

    private final ClothingRecommendationService recommendationService;

    /**
     * ✅ 오늘 날씨 기준 전체 추천
     *  - 예) GET /api/recommend/today?region=Seoul&lat=37.5665&lon=126.9780
     */
    @GetMapping("/today")
    public ApiResponse<List<ClothingItemResponseDto>> recommendToday(
            @RequestParam(name = "region", defaultValue = "Seoul") String region,
            @RequestParam(name = "lat", defaultValue = "37.5665") double lat,
            @RequestParam(name = "lon", defaultValue = "126.9780") double lon
    ) {
        // ⚠️ 서비스 시그니처: (region, lat, lon)
        List<ClothingItem> items =
                recommendationService.recommendToday(region, lat, lon);

        List<ClothingItemResponseDto> response = items.stream()
                .map(ClothingItemResponseDto::from)
                .toList();

        return ApiResponse.success("오늘 날씨 기반 추천 결과입니다.", response);
    }

    /**
     * ✅ 오늘 날씨 + 카테고리 기준 추천
     *  - 예) GET /api/recommend/today/by-category?category=TOP&region=Seoul
     */
    @GetMapping("/today/by-category")
    public ApiResponse<List<ClothingItemResponseDto>> recommendTodayByCategory(
            @RequestParam(name = "category") ClothingCategory category,
            @RequestParam(name = "region", defaultValue = "Seoul") String region,
            @RequestParam(name = "lat", defaultValue = "37.5665") double lat,
            @RequestParam(name = "lon", defaultValue = "126.9780") double lon,
            @RequestParam(name = "limit", defaultValue = "20") int limit
    ) {
        // ⚠️ 서비스 시그니처:
        // recommendTodayByCategory(ClothingCategory category,
        //                          String region,
        //                          double lat,
        //                          double lon,
        //                          int limit)
        List<ClothingItem> items =
                recommendationService.recommendTodayByCategory(category, region, lat, lon, limit);

        List<ClothingItemResponseDto> response = items.stream()
                .map(ClothingItemResponseDto::from)
                .toList();

        return ApiResponse.success("오늘 날씨 + 카테고리 기반 추천 결과입니다.", response);
    }
}