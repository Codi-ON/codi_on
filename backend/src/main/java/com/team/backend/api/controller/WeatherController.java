package com.team.backend.api.controller;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.weather.DailyWeatherDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    @GetMapping("/today")
    public ApiResponse<DailyWeatherDto> getTodayWeather() {
        DailyWeatherDto dto = DailyWeatherDto.builder()
                .region("서울")
                .temperature(3.4)
                .minTemperature(1.2)
                .maxTemperature(5.8)
                .sky("맑음")
                .precipitationProbability(10)
                .humidity(40)
                .windSpeed(2.5)
                .build();

        return ApiResponse.success(dto);
    }
}