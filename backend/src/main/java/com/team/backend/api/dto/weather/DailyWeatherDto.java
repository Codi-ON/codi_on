package com.team.backend.api.dto.weather;

import com.team.backend.domain.DailyWeather;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class DailyWeatherDto {

    private final String region;
    private final LocalDate date;
    private final double temperature;
    private final double minTemperature;
    private final double maxTemperature;
    private final String sky;
    private final int precipitationProbability;
    private final int humidity;
    private final double windSpeed;

    // ✅ 서비스에서 쓰는 정적 팩토리 메서드
    public static DailyWeatherDto from(DailyWeather entity) {
        return DailyWeatherDto.builder()
                .region(entity.getRegion())
                .date(entity.getDate())
                .temperature(entity.getTemperature())
                .minTemperature(entity.getMinTemperature())
                .maxTemperature(entity.getMaxTemperature())
                .sky(entity.getSky())
                .precipitationProbability(entity.getPrecipitationProbability())
                .humidity(entity.getHumidity())
                .windSpeed(entity.getWindSpeed())
                .build();
    }
}