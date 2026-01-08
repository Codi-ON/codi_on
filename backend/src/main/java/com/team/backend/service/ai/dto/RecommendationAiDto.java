// src/main/java/com/team/backend/service/ai/dto/RecommendationAiDto.java
package com.team.backend.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class RecommendationAiDto {
    private RecommendationAiDto() {}

    // =========================
    // BLEND_RATIO Request
    // =========================

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlendContext {
        @JsonProperty("temperature")
        public Double temperature;

        @JsonProperty("humidity")
        public Double humidity;

        @JsonProperty("windSpeed")
        public Double windSpeed;

        @JsonProperty("cloudAmount")
        public Double cloudAmount;

        @JsonProperty("maxTemperature")
        public Double maxTemperature;

        @JsonProperty("minTemperature")
        public Double minTemperature;

        @JsonProperty("sky")
        public String sky;

        public BlendContext() {}

        public BlendContext(
                Double temperature,
                Double humidity,
                Double windSpeed,
                Double cloudAmount,
                Double maxTemperature,
                Double minTemperature,
                String sky
        ) {
            this.temperature = temperature;
            this.humidity = humidity;
            this.windSpeed = windSpeed;
            this.cloudAmount = cloudAmount;
            this.maxTemperature = maxTemperature;
            this.minTemperature = minTemperature;
            this.sky = sky;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlendItemReq {
        @JsonProperty("clothingId")
        public Long clothingId;

        @JsonProperty("c_ratio")
        public Integer cRatio;

        /** THICK | NORMAL | THIN */
        @JsonProperty("thickness")
        public String thickness;

        public BlendItemReq() {}

        public BlendItemReq(Long clothingId, Integer cRatio, String thickness) {
            this.clothingId = clothingId;
            this.cRatio = cRatio;
            this.thickness = thickness;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlendRatioRequest {
        @JsonProperty("context")
        public BlendContext context;

        @JsonProperty("items")
        public List<BlendItemReq> items;

        public BlendRatioRequest() {}

        public BlendRatioRequest(BlendContext context, List<BlendItemReq> items) {
            this.context = context;
            this.items = items;
        }
    }

    // =========================
    // BLEND_RATIO Response
    // =========================

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlendRatioResponse {
        @JsonProperty("results")
        public List<BlendRatioResult> results;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlendRatioResult {
        @JsonProperty("clothingId")
        public Long clothingId;

        @JsonProperty("blendRatioScore")
        public Double blendRatioScore;
    }

    // =========================
    // MATERIAL_RATIO
    // =========================

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MaterialRatioRequest {
        @JsonProperty("items")
        public List<MaterialItemReq> items;

        @JsonProperty("weather")
        public MaterialWeather weather;

        public MaterialRatioRequest() {}

        public MaterialRatioRequest(List<MaterialItemReq> items, MaterialWeather weather) {
            this.items = items;
            this.weather = weather;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MaterialItemReq {
        @JsonProperty("clothingId")
        public Long clothingId;

        @JsonProperty("name")
        public String name;

        @JsonProperty("thicknessLevel")
        public String thicknessLevel;

        @JsonProperty("color")
        public String color;

        public MaterialItemReq() {}

        public MaterialItemReq(Long clothingId, String name, String thicknessLevel, String color) {
            this.clothingId = clothingId;
            this.name = name;
            this.thicknessLevel = thicknessLevel;
            this.color = color;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MaterialWeather {
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

        public MaterialWeather() {}

        public MaterialWeather(
                Double temperature,
                Double feelsLikeTemperature,
                Double maxTemperature,
                Double minTemperature,
                Integer humidity,
                Integer precipitationProbability,
                Double windSpeed
        ) {
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
    public static class MaterialRatioResponse {
        @JsonProperty("results")
        public List<MaterialRatioResult> results;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MaterialRatioResult {
        @JsonProperty("clothingId")
        public Long clothingId;

        @JsonProperty("material_name")
        public String materialName;

        @JsonProperty("materialRatioScore")
        public Double materialRatioScore;

        @JsonProperty("analysis")
        public String analysis;
    }
}