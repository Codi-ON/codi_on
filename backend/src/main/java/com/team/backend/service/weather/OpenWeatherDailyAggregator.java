// src/main/java/com/team/backend/service/weather/OpenWeatherDailyAggregator.java
package com.team.backend.service.weather;

import com.team.backend.api.dto.weather.OpenWeatherForecastDto;
import com.team.backend.domain.DailyWeather;
import org.springframework.stereotype.Component;

import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class OpenWeatherDailyAggregator {

    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");

    /**
     * OpenWeather 5-day/3h forecast(list) → DailyWeather(일 단위) N일치 집계
     */
    public List<DailyWeather> aggregate(String region, OpenWeatherForecastDto forecast, int maxDays) {
        if (forecast == null || forecast.getList() == null || forecast.getList().isEmpty()) {
            return List.of();
        }

        // KST 기준 날짜로 그룹핑
        Map<LocalDate, List<OpenWeatherForecastDto.ForecastItem>> byDate =
                forecast.getList().stream()
                        .collect(Collectors.groupingBy(
                                item -> Instant.ofEpochSecond(item.getDt())
                                        .atZone(KST_ZONE)
                                        .toLocalDate(),
                                LinkedHashMap::new,
                                Collectors.toList()
                        ));

        return byDate.entrySet().stream()
                .limit(maxDays)
                .map(e -> aggregateDay(region, e.getKey(), e.getValue()))
                .toList();
    }

    private DailyWeather aggregateDay(String region, LocalDate date, List<OpenWeatherForecastDto.ForecastItem> items) {
        double avgTemp = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Main::getTemp)
                .average()
                .orElse(0.0);

        double minTemp = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Main::getTempMin)
                .min()
                .orElse(avgTemp);

        double maxTemp = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Main::getTempMax)
                .max()
                .orElse(avgTemp);

        double feelsLikeAvg = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Main::getFeelsLike)
                .average()
                .orElse(avgTemp);

        int cloudAvg = (int) Math.round(
                items.stream()
                        .map(OpenWeatherForecastDto.ForecastItem::getClouds)
                        .filter(Objects::nonNull)
                        .mapToInt(OpenWeatherForecastDto.Clouds::getAll)
                        .average()
                        .orElse(0.0)
        );

        int humidity = (int) Math.round(
                items.stream()
                        .map(OpenWeatherForecastDto.ForecastItem::getMain)
                        .filter(Objects::nonNull)
                        .mapToInt(OpenWeatherForecastDto.Main::getHumidity)
                        .average()
                        .orElse(0.0)
        );

        double windSpeed = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getWind)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Wind::getSpeed)
                .average()
                .orElse(0.0);

        int precipitationProbability = (int) Math.round(
                items.stream()
                        .mapToDouble(OpenWeatherForecastDto.ForecastItem::getPop)
                        .max()
                        .orElse(0.0) * 100
        );

        // weather.main 최빈값(대표 스카이)
        String sky = items.stream()
                .flatMap(item -> {
                    List<OpenWeatherForecastDto.Weather> w = item.getWeather();
                    return w == null ? Stream.<OpenWeatherForecastDto.Weather>empty() : w.stream();
                })
                .map(OpenWeatherForecastDto.Weather::getMain)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("UNKNOWN"); // sky NOT NULL 보호

        return DailyWeather.builder()
                .region(region)
                .date(date)
                .temperature(avgTemp)
                .minTemperature(minTemp)
                .maxTemperature(maxTemp)
                .feelsLikeTemperature(feelsLikeAvg)
                .cloudAmount(cloudAvg)
                .sky(sky)
                .precipitationProbability(precipitationProbability)
                .humidity(humidity)
                .windSpeed(windSpeed)
                .build();
    }
}