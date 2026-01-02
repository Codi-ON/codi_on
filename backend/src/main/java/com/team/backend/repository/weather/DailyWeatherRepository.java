package com.team.backend.repository.weather;

import com.team.backend.domain.DailyWeather;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyWeatherRepository extends JpaRepository<DailyWeather, Long> {

    Optional<DailyWeather> findByRegionAndDate(String region, LocalDate date);

    List<DailyWeather> findAllByRegionAndDateBetweenOrderByDateAsc(
            String region,
            LocalDate start,
            LocalDate end
    );

    long countByRegionAndDateBetween(String region, LocalDate start, LocalDate end);

    Optional<DailyWeather> findTopByRegionOrderByDateDesc(String region);

}