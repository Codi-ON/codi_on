package com.team.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "codi.default-location")
public class DefaultLocationConfig {
    private String region = "Seoul";
    private double lat = 37.5665;
    private double lon = 126.9780;
}