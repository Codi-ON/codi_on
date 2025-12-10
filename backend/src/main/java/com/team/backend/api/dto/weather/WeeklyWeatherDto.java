package com.team.backend.api.dto.weather;

import com.team.backend.domain.DailyWeather;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class WeeklyWeatherDto {

    private final String region;            // 지역 (서울, 부산 등)
    private final List<DayWeatherDto> days; // 일주일치 날씨 목록

    @Getter
    @Builder
    public static class DayWeatherDto {

        private final LocalDate date;        // 날짜
        private final double temperature;    // 현재 기온
        private final double minTemperature; // 최저 기온
        private final double maxTemperature; // 최고 기온

        private final String sky;                 // 맑음/흐림/비/눈
        private final int precipitationProbability; // 강수확률
        private final int humidity;               // 습도
        private final double windSpeed;           // 풍속

        // ✅ 엔티티 → DayWeatherDto 변환
        public static DayWeatherDto from(DailyWeather entity) {
            return DayWeatherDto.builder()
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

    // ✅ 엔티티 리스트 → WeeklyWeatherDto 변환
    public static WeeklyWeatherDto from(String region, List<DailyWeather> entities) {
        List<DayWeatherDto> days = entities.stream()
                .map(DayWeatherDto::from)
                .toList();

        return WeeklyWeatherDto.builder()
                .region(region)
                .days(days)
                .build();
    }
}