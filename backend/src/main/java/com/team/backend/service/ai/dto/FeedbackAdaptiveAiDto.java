// src/main/java/com/team/backend/service/ai/dto/FeedbackAdaptiveAiDto.java
package com.team.backend.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class FeedbackAdaptiveAiDto {

    private FeedbackAdaptiveAiDto() {
    }

    // =========================
    // Request
    // =========================

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AdaptiveRequest {

        @JsonProperty("feedbackId")
        public UUID feedbackId;

        @JsonProperty("range")
        public Range range;

        @JsonProperty("prevBias")
        public Integer prevBias; // 0~100, 50 neutral

        @JsonProperty("weather")
        public Weather weather;

        @JsonProperty("items")
        public List<Item> items;

        @JsonProperty("samples")
        public List<Sample> samples;

        @JsonProperty("requestModels")
        public List<String> requestModels; // ["BLEND_ADAPTIVE","MATERIAL_ADAPTIVE"]
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Range {

        @JsonProperty("from")
        public LocalDate from;

        @JsonProperty("to")
        public LocalDate to;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Weather {

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

        @JsonProperty("windSpeed")
        public Double windSpeed;

        @JsonProperty("cloudAmount")
        public Integer cloudAmount;

        @JsonProperty("sky")
        public String sky;

        @JsonProperty("precipitationProbability")
        public Integer precipitationProbability;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {

        @JsonProperty("clothingId")
        public Long clothingId;

        // JSON key is "c_ratio"
        @JsonProperty("c_ratio")
        public Integer cRatio;

        @JsonProperty("thickness")
        public String thickness; // "THICK" / "NORMAL" / "THIN"

        @JsonProperty("name")
        public String name;

        @JsonProperty("color")
        public String color;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Sample {

        @JsonProperty("timestamp")
        public String timestamp;

        @JsonProperty("direction")
        public Integer direction; // -1 / 0 / 1

        @JsonProperty("selectedClothingIds")
        public List<Long> selectedClothingIds;
    }

    // =========================
    // Response
    // =========================

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AdaptiveResponse {

        @JsonProperty("feedbackId")
        public UUID feedbackId; // echo

        @JsonProperty("userBias")
        public Integer userBias; // 0~100

        @JsonProperty("models")
        public List<ModelResult> models;

        @JsonProperty("meta")
        public Meta meta;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ModelResult {

        @JsonProperty("modelType")
        public String modelType; // BLEND_ADAPTIVE / MATERIAL_ADAPTIVE

        @JsonProperty("results")
        public List<ScoredItem> results;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScoredItem {

        @JsonProperty("clothingId")
        public Long clothingId;

        @JsonProperty("score")
        public Integer score; // 0~100 (int)
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Meta {

        @JsonProperty("modelVersion")
        public String modelVersion;

        @JsonProperty("reRanked")
        public Boolean reRanked;
    }
}