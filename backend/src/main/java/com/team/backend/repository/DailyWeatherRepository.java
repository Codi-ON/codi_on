package com.team.backend.repository;

import com.team.backend.domain.DailyWeather;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyWeatherRepository extends JpaRepository<DailyWeather, Long> {

    // 오늘 날짜 데이터들 (중복 가능성 고려해서 List)
    List<DailyWeather> findByRegionAndDateOrderByIdDesc(String region, LocalDate date);

    // 기간 내 데이터 (주간 조회용)
    List<DailyWeather> findByRegionAndDateBetweenOrderByDateAsc(String region,
                                                                LocalDate start,
                                                                LocalDate end);

    // 해당 지역의 가장 최근 날짜 1개
    Optional<DailyWeather> findTopByRegionOrderByDateDesc(String region);

    // (선택) 새로 저장하기 전에 해당 기간 데이터 싹 정리하고 싶을 때
    void deleteByRegionAndDateBetween(String region, LocalDate start, LocalDate end);
}