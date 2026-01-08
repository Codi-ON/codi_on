// src/main/java/com/team/backend/service/ai/dto/RecommendationAiClient.java
package com.team.backend.service.ai.dto;

import com.team.backend.config.AiUpstreamException;
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

    @Value("${ai.blend-ratio-path:/recommend/blend-ratio}")
    private String blendRatioPath;

    @Value("${ai.material-ratio-path:/recommend/material_ratio}")
    private String materialRatioPath;

    public RecommendationAiClient(@Qualifier("aiRestTemplate") RestTemplate aiRestTemplate) {
        this.aiRestTemplate = aiRestTemplate;
    }

    public RecommendationAiDto.BlendRatioResponse recommendBlendRatio(RecommendationAiDto.ComfortBatchRequest req) {
        return executePost(normalizePath(blendRatioPath), req, RecommendationAiDto.BlendRatioResponse.class, "BLEND_RATIO");
    }

    public RecommendationAiDto.MaterialRatioResponse recommendMaterialRatio(RecommendationAiDto.ComfortBatchRequest req) {
        return executePost(normalizePath(materialRatioPath), req, RecommendationAiDto.MaterialRatioResponse.class, "MATERIAL_RATIO");
    }

    private <T> T executePost(String path, RecommendationAiDto.ComfortBatchRequest req, Class<T> responseType, String tag) {
        validateRequest(req);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<RecommendationAiDto.ComfortBatchRequest> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<T> res = aiRestTemplate.exchange(path, HttpMethod.POST, entity, responseType);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                throw new AiUpstreamException("AI_BAD_RESPONSE", 502, tag + " returned empty body");
            }
            return res.getBody();

        } catch (HttpStatusCodeException e) {
            throw new AiUpstreamException(
                    "AI_HTTP_" + e.getStatusCode().value(),
                    502,
                    tag + " error: status=" + e.getStatusCode().value() + ", body=" + safeBody(e)
            );
        } catch (ResourceAccessException e) {
            throw new AiUpstreamException("AI_TIMEOUT", 504, tag + " timeout/connection error: " + e.getMessage());
        } catch (RestClientException e) {
            throw new AiUpstreamException("AI_CLIENT_ERROR", 502, tag + " client error: " + e.getMessage());
        }
    }

    private void validateRequest(RecommendationAiDto.ComfortBatchRequest req) {
        if (req == null) throw new IllegalArgumentException("req is required");
        if (req.context == null) throw new IllegalArgumentException("context is required");
        if (req.items == null || req.items.isEmpty()) throw new IllegalArgumentException("items must not be empty");

        for (RecommendationAiDto.ItemReq it : req.items) {
            if (it == null) throw new IllegalArgumentException("item must not be null");
            if (it.clothingId == null) throw new IllegalArgumentException("clothingId is required");
            if (it.thickness == null || it.thickness.isBlank()) throw new IllegalArgumentException("thickness is required");
            if (it.cRatio == null) throw new IllegalArgumentException("c_ratio is required");
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