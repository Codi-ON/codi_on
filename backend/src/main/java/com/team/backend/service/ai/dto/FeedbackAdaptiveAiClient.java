package com.team.backend.service.ai.dto;// src/main/java/com/team/backend/service/ai/FeedbackAdaptiveAiClient.java

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class FeedbackAdaptiveAiClient {

    private final RestClient aiRestClient;

    public FeedbackAdaptiveAiDto.AdaptiveResponse adaptive(
            String sessionKey,
            FeedbackAdaptiveAiDto.AdaptiveRequest request
    ) {
        return aiRestClient.post()
                .uri("/api/feedback/backend/last-payload")
                .header("X-Session-Key", sessionKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(FeedbackAdaptiveAiDto.AdaptiveResponse.class);
    }
}