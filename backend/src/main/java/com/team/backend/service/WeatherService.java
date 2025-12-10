package com.team.backend.service;

import com.team.backend.api.dto.weather.DailyWeatherDto;
import com.team.backend.api.dto.weather.WeeklyWeatherDto;
import com.team.backend.domain.DailyWeather;
import com.team.backend.repository.DailyWeatherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WeatherService {

    private final DailyWeatherRepository dailyWeatherRepository;

    /**
     * 오늘 날씨 조회
     */
    public DailyWeatherDto getTodayWeather(String region) {
        LocalDate today = LocalDate.now();

        DailyWeather entity = dailyWeatherRepository
                .findByRegionAndDate(region, today)
                // 오늘 데이터 없을 때 가장 최근 데이터로 fallback (임시 전략)
                .orElseGet(() -> dailyWeatherRepository
                        .findTopByRegionOrderByDateDesc(region)
                        .orElseThrow(() ->
                                new IllegalArgumentException("해당 지역의 날씨 데이터가 없습니다."))
                );

        return DailyWeatherDto.from(entity);
    }

    /**
     * 오늘 포함 일주일치 날씨 조회
     */
    public WeeklyWeatherDto getWeeklyWeather(String region) {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(6);

        List<DailyWeather> entities =
                dailyWeatherRepository.findByRegionAndDateBetween(region, start, end);

        return WeeklyWeatherDto.from(region, entities);
    }
}