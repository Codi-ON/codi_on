package com.team.backend.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class RecommendationAiDto {

    private RecommendationAiDto() {}

    // =========================
    // Request
    // =========================

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RecommendationRequest {
        @JsonProperty("items")
        public List<Item> items;

        @JsonProperty("weather")
        public WeatherData weather;

        public RecommendationRequest() {}
        public RecommendationRequest(List<Item> items, WeatherData weather) {
            this.items = items;
            this.weather = weather;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WeatherData {
        @JsonProperty("temperature")
        public Double temperature;

        @JsonProperty("feelsLikeTemperature")
        public Double feelsLikeTemperature;

        @JsonProperty("humidity")
        public Integer humidity;

        @JsonProperty("precipitationProbability")
        public Integer precipitationProbability;

        public WeatherData() {}
        public WeatherData(Double temperature, Double feelsLikeTemperature, Integer humidity, Integer precipitationProbability) {
            this.temperature = temperature;
            this.feelsLikeTemperature = feelsLikeTemperature;
            this.humidity = humidity;
            this.precipitationProbability = precipitationProbability;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        @JsonProperty("clothingId")
        public Long clothingId;

        @JsonProperty("name")
        public String name;

        @JsonProperty("category")
        public String category;

        public Item() {}
        public Item(Long clothingId, String name, String category) {
            this.clothingId = clothingId;
            this.name = name;
            this.category = category;
        }
    }

    // =========================
    // Response
    // =========================

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RecommendationResponse {
        @JsonProperty("status")
        public String status;

        @JsonProperty("recommendations")
        public List<Recommendation> recommendations;

        @JsonProperty("message")
        public String message; // fail/error 시 대비 (AI가 넣는 경우)
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Recommendation {
        @JsonProperty("clothingId")
        public Long clothingId;

        // AI가 material_name으로 주더라도 깨지지 않게 수용
        @JsonProperty("name")
        @JsonAlias({"material_name"})
        public String name;

        @JsonProperty("score")
        public Double score;

        @JsonProperty("analysis")
        public String analysis;
    }
}