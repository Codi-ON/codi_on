// src/main/java/com/team/backend/service/ai/dto/FeedbackAdaptiveAiDto.java
package com.team.backend.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class FeedbackAdaptiveAiDto {

    private FeedbackAdaptiveAiDto() {}

    // =========================
    // Request
    // =========================
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AdaptiveRequest {
        @JsonProperty("feedbackId")
        public UUID feedbackId;

        @JsonProperty("range")
        public Range range;

        @JsonProperty("prevBias")
        public Integer prevBias; // 0~100, 50 neutral

        @JsonProperty("samples")
        public List<Sample> samples;

        @JsonProperty("requestModels")
        public List<String> requestModels; // ["BLEND_ADAPTIVE","MATERIAL_ADAPTIVE"]
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Range {
        @JsonProperty("from")
        public LocalDate from;

        @JsonProperty("to")
        public LocalDate to;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Sample {
        @JsonProperty("timestamp")
        public OffsetDateTime timestamp; // "2026-01-12T21:00:00+09:00"

        @JsonProperty("direction")
        public Integer direction; // -1/0/1

        @JsonProperty("selectedClothingIds")
        public List<Long> selectedClothingIds;
    }

    // =========================
    // Response
    // =========================
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
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

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ModelResult {
        @JsonProperty("modelType")
        public String modelType; // BLEND_ADAPTIVE / MATERIAL_ADAPTIVE

        @JsonProperty("results")
        public List<ScoredItem> results;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScoredItem {
        @JsonProperty("clothingId")
        public Long clothingId;

        @JsonProperty("score")
        public Integer score; // 0~100 (정수로 고정)
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Meta {
        @JsonProperty("modelVersion")
        public String modelVersion;

        @JsonProperty("reRanked")
        public Boolean reRanked;
    }
}