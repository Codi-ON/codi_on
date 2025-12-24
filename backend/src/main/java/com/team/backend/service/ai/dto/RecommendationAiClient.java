package com.team.backend.service.ai;

import com.team.backend.config.AiUpstreamException;
import com.team.backend.service.ai.dto.RecommendationAiDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Slf4j
@Component
public class RecommendationAiClient {

    private final RestTemplate aiRestTemplate;

    @Value("${ai.recommend-path:/recommend}")
    private String recommendPath;

    public RecommendationAiClient(@Qualifier("aiRestTemplate") RestTemplate aiRestTemplate) {
        this.aiRestTemplate = aiRestTemplate;
    }

    public RecommendationAiDto.RecommendationResponse recommend(RecommendationAiDto.RecommendationRequest req) {
        validateRequest(req);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<RecommendationAiDto.RecommendationRequest> entity = new HttpEntity<>(req, headers);
        String path = normalizePath(recommendPath);

        try {
            ResponseEntity<RecommendationAiDto.RecommendationResponse> res =
                    aiRestTemplate.exchange(path, HttpMethod.POST, entity, RecommendationAiDto.RecommendationResponse.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                throw new AiUpstreamException("AI_BAD_RESPONSE", 502, "AI returned empty body");
            }

            // AI가 200이어도 status=fail/error로 내려줄 수 있으니 여기서 걸러준다.
            RecommendationAiDto.RecommendationResponse body = res.getBody();
            String st = (body.status == null ? "" : body.status.trim().toLowerCase());

            if (!"success".equals(st)) {
                throw new AiUpstreamException(
                        "AI_APP_FAIL",
                        502,
                        "AI status is not success. status=" + body.status + ", message=" + body.message
                );
            }

            if (body.recommendations == null) {
                throw new AiUpstreamException("AI_BAD_SCHEMA", 502, "AI recommendations is null");
            }

            return body;

        } catch (HttpStatusCodeException e) {
            throw new AiUpstreamException(
                    "AI_HTTP_" + e.getStatusCode().value(),
                    502,
                    "AI error: status=" + e.getStatusCode().value() + ", body=" + safeBody(e)
            );
        } catch (ResourceAccessException e) {
            throw new AiUpstreamException("AI_TIMEOUT", 504, "AI timeout/connection error: " + e.getMessage());
        } catch (RestClientException e) {
            throw new AiUpstreamException("AI_CLIENT_ERROR", 502, "AI client error: " + e.getMessage());
        }
    }

    private void validateRequest(RecommendationAiDto.RecommendationRequest req) {
        if (req == null) throw new IllegalArgumentException("req is required");
        if (req.weather == null) throw new IllegalArgumentException("weather is required");
        if (req.items == null || req.items.isEmpty()) throw new IllegalArgumentException("items must not be empty");

        for (RecommendationAiDto.Item it : req.items) {
            if (it == null) throw new IllegalArgumentException("item must not be null");
            if (it.clothingId == null) throw new IllegalArgumentException("clothingId is required");
            if (it.name == null || it.name.isBlank()) throw new IllegalArgumentException("name is required");
            if (it.category == null || it.category.isBlank()) throw new IllegalArgumentException("category is required");
        }
    }

    private String normalizePath(String p) {
        if (p == null || p.isBlank()) return "/recommend";
        return p.startsWith("/") ? p : ("/" + p);
    }

    private String safeBody(HttpStatusCodeException e) {
        try {
            byte[] b = e.getResponseBodyAsByteArray();
            if (b == null || b.length == 0) return "";
            return new String(b, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            return "";
        }
    }
}