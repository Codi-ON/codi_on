package com.team.backend.api.dto.weather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class OpenWeatherForecastDto {

    // OpenWeather: "200" 같은 문자열로 옴
    private String cod;

    // forecast items (3시간 단위)
    private List<ForecastItem> list;

    @Data
    public static class ForecastItem {
        private long dt;                 // unix seconds
        private Main main;
        private List<Weather> weather;
        private Wind wind;
        private Clouds clouds;           // ✅ 구름양
        private double pop;              // 강수확률(0~1)
        @JsonProperty("dt_txt")
        private String dtTxt;            // "2025-12-15 12:00:00" (옵션)
    }

    @Data
    public static class Main {
        private double temp;

        @JsonProperty("temp_min")
        private double tempMin;

        @JsonProperty("temp_max")
        private double tempMax;

        @JsonProperty("feels_like")
        private double feelsLike;        // ✅ 체감온도

        private int humidity;
    }

    @Data
    public static class Weather {
        private String main;
        private String description;
    }

    @Data
    public static class Wind {
        private double speed;
    }

    @Data
    public static class Clouds {
        @JsonProperty("all")
        private int all;                 // ✅ 구름양(0~100)
    }
}