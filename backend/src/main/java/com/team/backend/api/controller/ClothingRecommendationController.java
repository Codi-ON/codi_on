package com.team.backend.api.controller;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.service.ClothingRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ClothingRecommendationController.API_PREFIX)
@RequiredArgsConstructor
public class ClothingRecommendationController {

    // ==============================
    // 🔗 공통 URL prefix / path 상수
    // ==============================
    public static final String API_PREFIX = "/api/recommend";
    public static final String PATH_TODAY = "/today";
    public static final String PATH_TODAY_BY_CATEGORY = "/today/by-category";

    // ==============================
    // 🔗 공통 RequestParam 이름 상수
    // ==============================
    public static final String PARAM_REGION = "region";
    public static final String PARAM_LAT    = "lat";
    public static final String PARAM_LON    = "lon";
    public static final String PARAM_LIMIT  = "limit";

    // ==============================
    // 📍 기본 좌표 / 지역 상수 (서울 고정)
    // ==============================
    private static final double DEFAULT_LAT     = 37.5665;
    private static final double DEFAULT_LON     = 126.9780;
    private static final String DEFAULT_REGION  = "Seoul";

    // ==============================
    // ✅ limit 정책 (과호출 방지)
    // ==============================
    private static final int DEFAULT_LIMIT = 20;
    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 50;

    private final ClothingRecommendationService clothingRecommendationService;

    // ==============================
    // 1) 오늘 추천 (전체)
    // GET /api/recommend/today
    // GET /api/recommend/today?region=Seoul&lat=37.5665&lon=126.9780&limit=20
    // ==============================
    @GetMapping(PATH_TODAY)
    public ApiResponse<List<ClothingItemResponseDto>> today(
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon,
            @RequestParam(name = PARAM_LIMIT,  defaultValue = "" + DEFAULT_LIMIT) int limit
    ) {
        int resolvedLimit = resolveLimitOrThrow(limit);
        return ApiResponse.success(
                clothingRecommendationService.recommendToday(region, lat, lon, resolvedLimit)
        );
    }

    // ==============================
    // 2) 오늘 추천 (카테고리)
    // GET /api/recommend/today/by-category?category=TOP
    // ==============================
    @GetMapping(PATH_TODAY_BY_CATEGORY)
    public ApiResponse<List<ClothingItemResponseDto>> todayByCategory(
            @RequestParam ClothingCategory category,
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon,
            @RequestParam(name = PARAM_LIMIT,  defaultValue = "" + DEFAULT_LIMIT) int limit
    ) {
        int resolvedLimit = resolveLimitOrThrow(limit);
        return ApiResponse.success(
                clothingRecommendationService.recommendTodayByCategory(category, region, lat, lon, resolvedLimit)
        );
    }

    private int resolveLimitOrThrow(Integer limit) {
        int v = (limit == null ? DEFAULT_LIMIT : limit);
        if (v < MIN_LIMIT || v > MAX_LIMIT) {
            throw new IllegalArgumentException("limit은 " + MIN_LIMIT + "~" + MAX_LIMIT + " 사이만 허용됩니다.");
        }
        return v;
    }
}