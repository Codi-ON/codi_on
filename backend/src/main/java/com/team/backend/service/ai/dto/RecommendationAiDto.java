// src/main/java/com/team/backend/service/ai/dto/RecommendationAiDto.java
package com.team.backend.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class RecommendationAiDto {

    private RecommendationAiDto() {}

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

        @JsonProperty("maxTemperature")
        public Double maxTemperature;

        @JsonProperty("minTemperature")
        public Double minTemperature;

        @JsonProperty("humidity")
        public Integer humidity;

        @JsonProperty("precipitationProbability")
        public Integer precipitationProbability;

        @JsonProperty("windSpeed")
        public Double windSpeed;

        public WeatherData() {}

        public WeatherData(Double temperature,
                          Double feelsLikeTemperature,
                          Double maxTemperature,
                          Double minTemperature,
                          Integer humidity,
                          Integer precipitationProbability,
                          Double windSpeed) {
            this.temperature = temperature;
            this.feelsLikeTemperature = feelsLikeTemperature;
            this.maxTemperature = maxTemperature;
            this.minTemperature = minTemperature;
            this.humidity = humidity;
            this.precipitationProbability = precipitationProbability;
            this.windSpeed = windSpeed;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        @JsonProperty("clothingId")
        @JsonAlias({"clothing_id"})
        public Long clothingId;

        @JsonProperty("name")
        public String name;

        @JsonProperty("category")
        public String category;

        @JsonProperty("thicknessLevel")
        public String thicknessLevel; // THICK | NORMAL | THIN

        @JsonProperty("color")
        public String color;

        public Item() {}

        public Item(Long clothingId, String name, String category, String thicknessLevel, String color) {
            this.clothingId = clothingId;
            this.name = name;
            this.category = category;
            this.thicknessLevel = thicknessLevel;
            this.color = color;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RecommendationResponse {
        @JsonProperty("status")
        public String status;

        @JsonProperty("recommendations")
        public List<Recommendation> recommendations;

        @JsonProperty("message")
        public String message;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Recommendation {
        @JsonProperty("clothingId")
        @JsonAlias({"clothing_id"})
        public Long clothingId;

        @JsonProperty("name")
        @JsonAlias({"material_name"})
        public String name;

        @JsonProperty("score")
        @JsonAlias({"blend_ratio_score", "material_ratio_score"})
        public Double score;

        @JsonProperty("analysis")
        public String analysis;
    }
}