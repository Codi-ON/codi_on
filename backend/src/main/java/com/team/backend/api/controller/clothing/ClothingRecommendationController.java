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

    // ==============================
    // URL prefix / path constants
    // ==============================
    public static final String API_PREFIX              = "/api/recommend";
    public static final String PATH_TODAY              = "/today";
    public static final String PATH_TODAY_BY_CATEGORY  = "/today/by-category";

    // ==============================
    // RequestParam constants
    // ==============================
    public static final String PARAM_REGION   = "region";
    public static final String PARAM_LAT      = "lat";
    public static final String PARAM_LON      = "lon";
    public static final String PARAM_LIMIT    = "limit";
    public static final String PARAM_CATEGORY = "category";

    // ==============================
    // Default location (Seoul)
    // ==============================
    private static final double DEFAULT_LAT    = 37.5665;
    private static final double DEFAULT_LON    = 126.9780;
    private static final String DEFAULT_REGION = "Seoul";

    // ==============================
    // limit policy
    // - IMPORTANT:
    //   limit = candidate pool size for ML scoring (NOT response size)
    //   response is fixed to Top3 per category at service level
    // ==============================
    private static final int DEFAULT_LIMIT = 50;
    private static final int MIN_LIMIT = 3;
    private static final int MAX_LIMIT = 300;

    private final ClothingRecommendationService clothingRecommendationService;

    /**
     * 1) Today's recommendation (all categories)
     * GET /api/recommend/today?region=Seoul&lat=37.5665&lon=126.9780&limit=50
     */
    @GetMapping(PATH_TODAY)
    public ApiResponse<List<ClothingItemResponseDto>> today(
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon,
            @RequestParam(name = PARAM_LIMIT,  defaultValue = "" + DEFAULT_LIMIT) Integer limit
    ) {
        int resolvedLimit = resolveLimitOrThrow(limit);
        return ApiResponse.success(
                clothingRecommendationService.recommendToday(region, lat, lon, resolvedLimit)
        );
    }

    /**
     * 2) Today's recommendation (by category)
     * GET /api/recommend/today/by-category?category=TOP&region=Seoul&lat=...&lon=...&limit=50
     */
    @GetMapping(PATH_TODAY_BY_CATEGORY)
    public ApiResponse<List<ClothingItemResponseDto>> todayByCategory(
            @RequestParam(name = PARAM_CATEGORY) ClothingCategory category,
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon,
            @RequestParam(name = PARAM_LIMIT,  defaultValue = "" + DEFAULT_LIMIT) Integer limit
    ) {
        int resolvedLimit = resolveLimitOrThrow(limit);
        return ApiResponse.success(
                clothingRecommendationService.recommendTodayByCategory(category, region, lat, lon, resolvedLimit)
        );
    }

    private int resolveLimitOrThrow(Integer limit) {
        int v = (limit == null ? DEFAULT_LIMIT : limit);
        if (v < MIN_LIMIT || v > MAX_LIMIT) {
            throw new IllegalArgumentException("limit must be between " + MIN_LIMIT + " and " + MAX_LIMIT + ".");
        }
        return v;
    }
}