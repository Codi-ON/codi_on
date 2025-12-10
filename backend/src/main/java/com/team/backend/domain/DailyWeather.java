package com.team.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

// domain/weather/DailyWeather.java
@Entity
@Table(name = "daily_weather")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DailyWeather {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String region;                // 서울, 부산 ...
    private LocalDate date;              // 2025-12-10

    private double temperature;          // 현재 기온
    private double minTemperature;       // 최저
    private double maxTemperature;       // 최고

    private String sky;                  // 맑음, 흐림 등
    private int precipitationProbability;// 강수확률
    private int humidity;                // 습도
    private double windSpeed;            // 풍속
}