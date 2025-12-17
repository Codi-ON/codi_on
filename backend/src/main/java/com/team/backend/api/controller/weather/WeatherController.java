// src/main/java/com/team/backend/api/controller/weather/WeatherController.java
package com.team.backend.api.controller.weather;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.weather.DailyWeatherResponseDto;
import com.team.backend.api.dto.weather.WeeklyWeatherResponseDto;
import com.team.backend.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(WeatherController.API_PREFIX)
@RequiredArgsConstructor
public class WeatherController {

    // ==============================
    // 🔗 공통 URL prefix / path 상수
    // ==============================
    public static final String API_PREFIX  = "/api/weather";
    public static final String PATH_TODAY  = "/today";   // /api/weather/today
    public static final String PATH_WEEKLY = "/weekly";  // /api/weather/weekly

    // ==============================
    // 🔗 공통 RequestParam 이름 상수
    // ==============================
    public static final String PARAM_REGION = "region";
    public static final String PARAM_LAT    = "lat";
    public static final String PARAM_LON    = "lon";

    // ==============================
    // 📍 기본 좌표 / 지역 상수 (서울 고정 기본값)
    // ==============================
    public static final double DEFAULT_LAT    = 37.5665;
    public static final double DEFAULT_LON    = 126.9780;
    public static final String DEFAULT_REGION = "Seoul";

    private final WeatherService weatherService;

    // ==============================
    // 1) 오늘 날씨 (프론트)
    // ==============================
    @GetMapping(PATH_TODAY)
    public ApiResponse<DailyWeatherResponseDto> getToday(
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT, defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON, defaultValue = "" + DEFAULT_LON) double lon
    ) {
        return ApiResponse.success(weatherService.getTodaySmart(lat, lon, region));
    }

    // ==============================
    // 2) 주간 날씨 (프론트: DB 기준 조회)
    // ==============================
    @GetMapping(PATH_WEEKLY)
    public ApiResponse<WeeklyWeatherResponseDto> getWeekly(
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region
    ) {
        return ApiResponse.success(weatherService.getWeeklyWeatherFromDb(region));
    }
}