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

    public static final String API_PREFIX             = "/api/recommend";
    public static final String PATH_TODAY             = "/today";
    public static final String PATH_TODAY_BY_CATEGORY = "/today/by-category";

    public static final String PARAM_REGION   = "region";
    public static final String PARAM_LAT      = "lat";
    public static final String PARAM_LON      = "lon";
    public static final String PARAM_LIMIT    = "limit";
    public static final String PARAM_CATEGORY = "category";

    private static final double DEFAULT_LAT    = 37.5665;
    private static final double DEFAULT_LON    = 126.9780;
    private static final String DEFAULT_REGION = "Seoul";

    // limit은 "후보 풀" 크기 (최종 Top3는 서비스 정책)
    private static final int DEFAULT_LIMIT = 50;
    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 200;

    private final ClothingRecommendationService clothingRecommendationService;

    @GetMapping(PATH_TODAY)
    public ApiResponse<List<ClothingItemResponseDto>> today(
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon,
            @RequestParam(name = PARAM_LIMIT,  defaultValue = "" + DEFAULT_LIMIT) Integer limit
    ) {
        int resolved = resolveLimitOrThrow(limit);
        return ApiResponse.success(
                clothingRecommendationService.recommendToday(region, lat, lon, resolved)
        );
    }

    @GetMapping(PATH_TODAY_BY_CATEGORY)
    public ApiResponse<List<ClothingItemResponseDto>> todayByCategory(
            @RequestParam(name = PARAM_CATEGORY) ClothingCategory category,
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon,
            @RequestParam(name = PARAM_LIMIT,  defaultValue = "" + DEFAULT_LIMIT) Integer limit
    ) {
        int resolved = resolveLimitOrThrow(limit);
        return ApiResponse.success(
                clothingRecommendationService.recommendTodayByCategory(category, region, lat, lon, resolved)
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