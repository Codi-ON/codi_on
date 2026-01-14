package com.team.backend.service.ai.dto; // src/main/java/com/team/backend/service/ai/dto/FeedbackAdaptiveAiClient.java

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class FeedbackAdaptiveAiClient {

    private final RestClient aiRestClient;

    public FeedbackAdaptiveAiDto.AdaptiveResponse adaptive(
            String sessionKey,
            int year,
            int month,
            FeedbackAdaptiveAiDto.AdaptiveRequest request
    ) {
        String uri = UriComponentsBuilder
                .fromPath("/api/feedback/adaptive")
                .queryParam("year", year)
                .queryParam("month", month)
                .build()
                .toUriString();

        return aiRestClient.post()
                .uri(uri)
                .header("X-Session-Key", sessionKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(FeedbackAdaptiveAiDto.AdaptiveResponse.class);
    }
}