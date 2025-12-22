// src/main/java/com/team/backend/service/ai/ComfortAiClient.java
package com.team.backend.service.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class ComfortAiClient {

    private final RestTemplate aiRestTemplate;

    public ComfortAiClient(@Qualifier("aiRestTemplate") RestTemplate aiRestTemplate) {
        this.aiRestTemplate = aiRestTemplate;
    }

    public BatchResponse predictComfortBatch(BatchRequest req) {
        BatchResponse res = aiRestTemplate.postForObject(
                "/predict/comfort/batch",
                req,
                BatchResponse.class
        );
        if (res == null) throw new IllegalStateException("AI batch response is null");
        if (res.results() == null) throw new IllegalStateException("AI batch response.results is null");
        return res;
    }

    // DTOs
    public record Context(
            @JsonProperty("Ta") double Ta,
            @JsonProperty("RH") int RH,
            @JsonProperty("Va") double Va,
            @JsonProperty("cloud") int cloud
    ) {}

    public record Item(
            @JsonProperty("item_id") long itemId,
            @JsonProperty("c_ratio") int cRatio,
            @JsonProperty("p_ratio") int pRatio
    ) {}

    public record BatchRequest(
            @JsonProperty("context") Context context,
            @JsonProperty("items") List<Item> items
    ) {}

    public record Result(
            @JsonProperty("item_id") long itemId,
            @JsonProperty("comfort_score") double comfortScore,
            @JsonProperty("error") String error
    ) {}

    public record BatchResponse(
            @JsonProperty("results") List<Result> results
    ) {}
}