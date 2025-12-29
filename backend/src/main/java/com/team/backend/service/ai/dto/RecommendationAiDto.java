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

        @JsonProperty("humidity")
        public Integer humidity;

        @JsonProperty("precipitationProbability")
        public Integer precipitationProbability;

        public WeatherData() {}
        public WeatherData(Double t, Double f, Integer h, Integer p) {
            temperature = t;
            feelsLikeTemperature = f;
            humidity = h;
            precipitationProbability = p;
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
        public Item(Long id, String name, String category) {
            this.clothingId = id;
            this.name = name;
            this.category = category;
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
        public Long clothingId;

        @JsonProperty("name")
        @JsonAlias({"material_name"})
        public String name;

        @JsonProperty("score")
        public Double score;

        @JsonProperty("analysis")
        public String analysis;
    }
}