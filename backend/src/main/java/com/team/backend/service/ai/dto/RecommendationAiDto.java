// src/main/java/com/team/backend/service/ai/dto/RecommendationAiDto.java
package com.team.backend.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class RecommendationAiDto {
    private RecommendationAiDto() {}

    // ========= Request (FastAPI schema: context + items) =========

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Context {
        /** Air temperature */
        @JsonProperty("Ta")
        public Double ta;

        /** Relative humidity */
        @JsonProperty("RH")
        public Double rh;

        /** Wind speed */
        @JsonProperty("Va")
        public Double va;

        /** Cloud amount */
        @JsonProperty("cloud")
        public Double cloud;

        /** Daily max temperature */
        @JsonProperty("temp_max")
        public Double tempMax;

        /** Daily min temperature */
        @JsonProperty("temp_min")
        public Double tempMin;

        /** Weather type (clear/cloudy/rain/snow) */
        @JsonProperty("weather_type")
        public String weatherType;

        public Context() {}

        public Context(Double ta, Double rh, Double va, Double cloud, Double tempMax, Double tempMin, String weatherType) {
            this.ta = ta;
            this.rh = rh;
            this.va = va;
            this.cloud = cloud;
            this.tempMax = tempMax;
            this.tempMin = tempMin;
            this.weatherType = weatherType;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ItemReq {
        @JsonProperty("clothingId")
        public Long clothingId;

        /** cotton percentage (0~100) */
        @JsonProperty("c_ratio")
        public Integer cRatio;

        /** THICK | NORMAL | THIN */
        @JsonProperty("thickness")
        public String thickness;

        public ItemReq() {}

        public ItemReq(Long clothingId, Integer cRatio, String thickness) {
            this.clothingId = clothingId;
            this.cRatio = cRatio;
            this.thickness = thickness;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ComfortBatchRequest {
        @JsonProperty("context")
        public Context context;

        @JsonProperty("items")
        public List<ItemReq> items;

        public ComfortBatchRequest() {}

        public ComfortBatchRequest(Context context, List<ItemReq> items) {
            this.context = context;
            this.items = items;
        }
    }

    // ========= Response: /recommend/blend-ratio =========
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

    // ========= Response: /recommend/material_ratio =========
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

        @JsonProperty("score")
        public Double score;

        @JsonProperty("analysis")
        public String analysis;
    }
}