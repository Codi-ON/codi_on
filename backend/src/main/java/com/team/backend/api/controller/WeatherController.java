package com.team.backend.api.controller;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.weather.DailyWeatherDto;
import com.team.backend.api.dto.weather.WeeklyWeatherDto;
import com.team.backend.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(WeatherController.API_PREFIX)
@RequiredArgsConstructor
public class WeatherController {

    // ==============================
    // 🔗 공통 URL prefix / path 상수
    // ==============================
    public static final String API_PREFIX   = "/api/weather";

    public static final String PATH_TODAY   = "/today";          // /api/weather/today
    public static final String PATH_WEEKLY  = "/weekly";         // /api/weather/weekly
    public static final String PATH_FETCH   = "/fetch";          // /api/weather/weekly/fetch
    public static final String PATH_FORCE   = "/force";          // /api/weather/weekly/fetch/force

    // ==============================
    // 🔗 공통 RequestParam 이름 상수
    // ==============================
    public static final String PARAM_REGION = "region";
    public static final String PARAM_LAT    = "lat";
    public static final String PARAM_LON    = "lon";

    // ==============================
    // 📍 기본 좌표 / 지역 상수
    // ==============================
    private static final double DEFAULT_LAT     = 37.5665;
    private static final double DEFAULT_LON     = 126.9780;
    private static final String DEFAULT_REGION  = "Seoul";

    private final WeatherService weatherService;

    // ==============================
    // 1) 오늘 날씨 조회 (프론트에서 주로 사용)
    //    - DB에 있으면 DB 사용
    //    - 없으면 주간 데이터 받아와서 오늘 데이터까지 채우는 "스마트" 버전
    // ==============================
    @GetMapping(PATH_TODAY)   // => GET /api/weather/today
    public ApiResponse<DailyWeatherDto> getToday(
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon
    ) {
        DailyWeatherDto dto = weatherService.getTodaySmart(lat, lon, region);
        return ApiResponse.success(dto);
    }

    // ==============================
    // 2) 주간 날씨 조회 (DB 기준)
    //    - 프론트에서 "그냥 조회"할 때 쓰는 API
    // ==============================
    @GetMapping(PATH_WEEKLY)   // => GET /api/weather/weekly
    public ApiResponse<WeeklyWeatherDto> getWeeklyFromDb(
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon
    ) {
        WeeklyWeatherDto dto = weatherService.getWeeklyWeatherFromDb(region);
        return ApiResponse.success(dto);
    }

    // ==============================
    // 3) 주간 날씨 fetch (DB에 없으면 외부 호출 + 저장)
    //    - 초기 진입 시 "데이터 없으면 채워줘" 용
    // ==============================
    @GetMapping(PATH_WEEKLY + PATH_FETCH)   // => GET /api/weather/weekly/fetch
    public ApiResponse<WeeklyWeatherDto> fetchWeeklyIfNeeded(
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon,
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region
    ) {
        WeeklyWeatherDto dto = weatherService.fetchWeeklyIfNeeded(lat, lon, region);
        return ApiResponse.success(dto);
    }

    // ==============================
    // 4) 주간 날씨 강제 fetch (관리자 / 배치용)
    //    - 무조건 외부 OpenWeather에서 새로 받아와서 DB 덮어쓰기
    // ==============================
    @GetMapping(PATH_WEEKLY + PATH_FETCH + PATH_FORCE) // => GET /api/weather/weekly/fetch/force
    public ApiResponse<WeeklyWeatherDto> forceFetchWeekly(
            @RequestParam(name = PARAM_LAT,    defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON,    defaultValue = "" + DEFAULT_LON) double lon,
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region
    ) {
        WeeklyWeatherDto dto = weatherService.getWeeklyWeather(lat, lon, region);
        return ApiResponse.success(dto);
    }
}