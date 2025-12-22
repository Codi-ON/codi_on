// src/main/java/com/team/backend/config/HttpClientConfig.java
package com.team.backend.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties(AiProperties.class) // ✅ 이거 없으면 AiProperties 바인딩 안 됨
public class HttpClientConfig {

    // 공용 RestTemplate (기존 유지)
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(2))
                .setReadTimeout(Duration.ofSeconds(3))
                .build();
    }

    // ✅ AI 전용 RestTemplate (rootUri + timeout 분리)
    @Bean
    @Qualifier("aiRestTemplate")
    public RestTemplate aiRestTemplate(RestTemplateBuilder builder, AiProperties aiProperties) {
        return builder
                .rootUri(aiProperties.getBaseUrl())
                .setConnectTimeout(Duration.ofMillis(aiProperties.getConnectTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(aiProperties.getReadTimeoutMs()))
                .build();
    }
}