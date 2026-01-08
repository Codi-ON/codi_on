package com.team.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "daily_weather",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_daily_weather_region_date", columnNames = {"region", "weather_date"})
        },
        indexes = {
                @Index(name = "idx_daily_weather_region_date", columnList = "region, weather_date")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DailyWeather {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "region", nullable = false, length = 30)
    private String region;

    @Column(name = "weather_date", nullable = false)
    private LocalDate date;

    @Column(name = "temperature", nullable = false)
    private Double temperature;

    @Column(name = "min_temperature", nullable = false)
    private Double minTemperature;

    @Column(name = "max_temperature", nullable = false)
    private Double maxTemperature;

    // ✅ 체감온도 (DB 컬럼명 feels_like_temperature)
    @Column(name = "feels_like_temperature", nullable = false)
    private Double feelsLikeTemperature;

    // ✅ 구름양 0~100 (DB 컬럼명 cloud_amount)
    @Column(name = "cloud_amount", nullable = false)
    private Integer cloudAmount;

    // ✅ 하늘 상태(예: CLEAR/CLOUDS/RAIN 등)
    @Column(name = "sky", nullable = false, length = 20)
    private String sky;

    @Column(name = "precipitation_probability", nullable = false)
    private Integer precipitationProbability;

    @Column(name = "humidity", nullable = false)
    private Integer humidity;

    @Column(name = "wind_speed", nullable = false)
    private Double windSpeed;

    @Column(name = "fetched_at", nullable = false)
    private LocalDateTime fetchedAt;

    public void updateFrom(
            Double temperature,
            Double minTemperature,
            Double maxTemperature,
            Double feelsLikeTemperature,
            Integer cloudAmount,
            String sky,
            Integer precipitationProbability,
            Integer humidity,
            Double windSpeed,
            LocalDateTime fetchedAt
    ) {
        this.temperature = temperature;
        this.minTemperature = minTemperature;
        this.maxTemperature = maxTemperature;
        this.feelsLikeTemperature = feelsLikeTemperature;
        this.cloudAmount = cloudAmount;
        this.sky = sky;
        this.precipitationProbability = precipitationProbability;
        this.humidity = humidity;
        this.windSpeed = windSpeed;
        this.fetchedAt = fetchedAt;
    }
}