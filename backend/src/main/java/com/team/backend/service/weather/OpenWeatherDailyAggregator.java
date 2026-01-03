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
                        .filter(Objects::nonNull)
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
        if (items == null || items.isEmpty()) {
            return DailyWeather.builder()
                    .region(region)
                    .date(date)
                    .temperature(0.0)
                    .minTemperature(0.0)
                    .maxTemperature(0.0)
                    .feelsLikeTemperature(0.0)
                    .cloudAmount(0)
                    .sky("UNKNOWN")
                    .precipitationProbability(0)
                    .humidity(0)
                    .windSpeed(0.0)
                    .build();
        }

        // ---------- 1) 후보 값 수집 ----------
        List<Double> tempCandidates = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .map(OpenWeatherForecastDto.Main::getTemp)
                .filter(Objects::nonNull)
                .toList();

        List<Double> tempMinCandidates = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .map(OpenWeatherForecastDto.Main::getTempMin)
                .filter(Objects::nonNull)
                .toList();

        List<Double> tempMaxCandidates = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .map(OpenWeatherForecastDto.Main::getTempMax)
                .filter(Objects::nonNull)
                .toList();

        List<Double> feelsLikeCandidates = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .map(OpenWeatherForecastDto.Main::getFeelsLike)
                .filter(Objects::nonNull)
                .toList();

        // ---------- 2) 집계 ----------
        double avgTemp = averageOr(tempCandidates, 0.0);

        // ✅ 핵심: min/max fallback을 avgTemp가 아니라 temp 기반으로
        double minTemp = minOr(tempMinCandidates, minOr(tempCandidates, avgTemp));
        double maxTemp = maxOr(tempMaxCandidates, maxOr(tempCandidates, avgTemp));

        double feelsLikeAvg = averageOr(feelsLikeCandidates, avgTemp);

        int cloudAvg = (int) Math.round(
                items.stream()
                        .map(OpenWeatherForecastDto.ForecastItem::getClouds)
                        .filter(Objects::nonNull)
                        .map(OpenWeatherForecastDto.Clouds::getAll)
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .average()
                        .orElse(0.0)
        );

        int humidity = (int) Math.round(
                items.stream()
                        .map(OpenWeatherForecastDto.ForecastItem::getMain)
                        .filter(Objects::nonNull)
                        .map(OpenWeatherForecastDto.Main::getHumidity)
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .average()
                        .orElse(0.0)
        );

        double windSpeed = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getWind)
                .filter(Objects::nonNull)
                .map(OpenWeatherForecastDto.Wind::getSpeed)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        int precipitationProbability = (int) Math.round(
                items.stream()
                        .map(OpenWeatherForecastDto.ForecastItem::getPop)
                        .filter(Objects::nonNull)
                        .mapToDouble(Double::doubleValue)
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
                .orElse("UNKNOWN");

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

    // ---------- helpers ----------
    private double averageOr(List<Double> values, double fallback) {
        if (values == null || values.isEmpty()) return fallback;
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(fallback);
    }

    private double minOr(List<Double> values, double fallback) {
        if (values == null || values.isEmpty()) return fallback;
        return values.stream().mapToDouble(Double::doubleValue).min().orElse(fallback);
    }

    private double maxOr(List<Double> values, double fallback) {
        if (values == null || values.isEmpty()) return fallback;
        return values.stream().mapToDouble(Double::doubleValue).max().orElse(fallback);
    }
}