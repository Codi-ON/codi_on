package com.team.backend.repository.weather;

import com.team.backend.domain.DailyWeather;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyWeatherRepository extends JpaRepository<DailyWeather, Long> {

    // ✅ UNIQUE(region, weather_date) 구조에서 "하루 1건" 조회
    Optional<DailyWeather> findByRegionAndDate(String region, LocalDate date);

    // ✅ 기간 조회 (주간 조회)
    List<DailyWeather> findAllByRegionAndDateBetweenOrderByDateAsc(
            String region,
            LocalDate start,
            LocalDate end
    );

    // ✅ 5일치 데이터 채워졌는지 확인용(성능 좋음)
    long countByRegionAndDateBetween(String region, LocalDate start, LocalDate end);

    // ✅ 최근 데이터 fallback
    Optional<DailyWeather> findTopByRegionOrderByDateDesc(String region);

    // (선택) 강제 fetch에서 구간을 싹 밀고 다시 넣고 싶으면 유지
    void deleteByRegionAndDateBetween(String region, LocalDate start, LocalDate end);
}