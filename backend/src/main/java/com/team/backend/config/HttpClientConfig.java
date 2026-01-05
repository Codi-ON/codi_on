package com.team.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Slf4j
@Configuration
public class HttpClientConfig {

    @Bean(name = "aiRestTemplate")
    public RestTemplate aiRestTemplate(
            RestTemplateBuilder builder,
            @Value("${ai.base-url:http://localhost:8000}") String baseUrl,
            @Value("${ai.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${ai.read-timeout-ms:7000}") int readTimeoutMs
    ) {
        log.info("[AI][CONFIG] baseUrl={}, connectTimeoutMs={}, readTimeoutMs={}",
                baseUrl, connectTimeoutMs, readTimeoutMs);

        return builder
                .rootUri(baseUrl)
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .additionalInterceptors((request, body, execution) -> {
                    long start = System.currentTimeMillis();
                    log.info("[AI][REQ] {} {}", request.getMethod(), request.getURI());
                    try {
                        ClientHttpResponse response = execution.execute(request, body);
                        log.info("[AI][RES] {} {} ({}ms)",
                                response.getStatusCode().value(),
                                request.getURI(),
                                System.currentTimeMillis() - start
                        );
                        return response;
                    } catch (Exception e) {
                        log.warn("[AI][ERR] {} {} message={}",
                                request.getMethod(),
                                request.getURI(),
                                e.getMessage()
                        );
                        throw e;
                    }
                })
                .build();
    }
}