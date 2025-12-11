package com.team.backend.api.dto.weather;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class OpenWeatherForecastDto {
    private String cod;
    private List<ForecastItem> list;

    @Data
    public static class ForecastItem {
        private long dt;
        private Main main;
        private List<Weather> weather;
        private Wind wind;
        private double pop;
    }

    @Data
    public static class Main {
        private double temp;
        @JsonProperty("temp_min")
        private double tempMin;
        @JsonProperty("temp_max")
        private double tempMax;
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
}