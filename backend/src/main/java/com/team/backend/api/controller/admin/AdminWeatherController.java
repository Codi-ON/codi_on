// src/main/java/com/team/backend/api/controller/admin/AdminWeatherController.java
package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.weather.WeeklyWeatherResponseDto;
import com.team.backend.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(AdminWeatherController.API_PREFIX)
@RequiredArgsConstructor
public class AdminWeatherController {

    public static final String API_PREFIX = "/api/admin/weather";

    public static final String PATH_WEEKLY_REFRESH = "/weekly/refresh";
    public static final String PARAM_FORCE = "force";

    // 파라미터/기본값은 WeatherController와 동일하게 유지
    public static final String PARAM_REGION = "region";
    public static final String PARAM_LAT    = "lat";
    public static final String PARAM_LON    = "lon";

    public static final double DEFAULT_LAT    = 37.5665;
    public static final double DEFAULT_LON    = 126.9780;
    public static final String DEFAULT_REGION = "Seoul";

    private final WeatherService weatherService;

    /**
     * POST /api/admin/weather/weekly/refresh?force=true|false
     * - force=false : DB 없을 때만 채움(fetchIfNeeded)
     * - force=true  : 무조건 외부 호출로 덮어쓰기(getWeeklyWeather)
     */
    @PostMapping(PATH_WEEKLY_REFRESH)
    public ApiResponse<WeeklyWeatherResponseDto> refreshWeekly(
            @RequestParam(name = PARAM_FORCE, defaultValue = "false") boolean force,
            @RequestParam(name = PARAM_REGION, defaultValue = DEFAULT_REGION) String region,
            @RequestParam(name = PARAM_LAT, defaultValue = "" + DEFAULT_LAT) double lat,
            @RequestParam(name = PARAM_LON, defaultValue = "" + DEFAULT_LON) double lon
    ) {
        WeeklyWeatherResponseDto dto = force
                ? weatherService.getWeeklyWeather(lat, lon, region)
                : weatherService.fetchWeeklyIfNeeded(lat, lon, region);

        return ApiResponse.success(dto);
    }
}