package com.team.backend.api.dto.weather;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class WeeklyWeatherResponseDto {

    private final String region;
    private final List<DailyWeatherResponseDto> days;

    public static WeeklyWeatherResponseDto of(String region, List<DailyWeatherResponseDto> days) {
        return WeeklyWeatherResponseDto.builder()
                .region(region)
                .days(days)
                .build();
    }
}