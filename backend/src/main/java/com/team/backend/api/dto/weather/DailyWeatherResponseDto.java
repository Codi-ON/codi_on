package com.team.backend.api.dto.weather;

import com.team.backend.domain.DailyWeather;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class DailyWeatherResponseDto {

    private final String region;
    private final LocalDate date;

    private final double temperature;
    private final double minTemperature;
    private final double maxTemperature;

    private final double feelsLikeTemperature; // ✅ 체감온도
    private final int cloudAmount;             // ✅ 구름양(0~100)

    private final String sky;
    private final int precipitationProbability;
    private final int humidity;
    private final double windSpeed;

    public static DailyWeatherResponseDto from(DailyWeather entity) {
        return DailyWeatherResponseDto.builder()
                .region(entity.getRegion())
                .date(entity.getDate())
                .temperature(entity.getTemperature())
                .minTemperature(entity.getMinTemperature())
                .maxTemperature(entity.getMaxTemperature())
                .feelsLikeTemperature(entity.getFeelsLikeTemperature())
                .cloudAmount(entity.getCloudAmount())
                .sky(entity.getSky())
                .precipitationProbability(entity.getPrecipitationProbability())
                .humidity(entity.getHumidity())
                .windSpeed(entity.getWindSpeed())
                .build();
    }
}