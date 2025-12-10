package com.team.backend.repository;

import com.team.backend.domain.DailyWeather;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyWeatherRepository extends JpaRepository<DailyWeather, Long> {

    // 오늘 날씨 (정확히 오늘 날짜)
    Optional<DailyWeather> findByRegionAndDate(String region, LocalDate date);

    // 최근 날짜 1개 (오늘 데이터 없을 때 fallback 용)
    Optional<DailyWeather> findTopByRegionOrderByDateDesc(String region);

    // 기간 조회 (오늘 ~ 6일 뒤 = 일주일)
    List<DailyWeather> findByRegionAndDateBetween(String region, LocalDate start, LocalDate end);
}