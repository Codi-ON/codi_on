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

    private final Double temperature;
    private final Double minTemperature;
    private final Double maxTemperature;

    private final Double feelsLikeTemperature;
    private final Integer cloudAmount;

    private final String sky;
    private final Integer precipitationProbability;
    private final Integer humidity;
    private final Double windSpeed;

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