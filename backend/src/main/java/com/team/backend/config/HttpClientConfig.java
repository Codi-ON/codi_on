package com.team.backend.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class HttpClientConfig {

    @Bean
    @Qualifier("aiRestTemplate")
    public RestTemplate aiRestTemplate(
            RestTemplateBuilder builder,
            @Value("${ai.base-url:http://localhost:8000}") String baseUrl,
            @Value("${ai.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${ai.read-timeout-ms:7000}") int readTimeoutMs
    ) {
        return builder
                .rootUri(baseUrl) // 핵심: ComfortAiClient는 path만 넘긴다
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }
}