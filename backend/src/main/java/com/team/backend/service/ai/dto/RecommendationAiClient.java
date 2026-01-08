// src/main/java/com/team/backend/service/ai/dto/RecommendationAiClient.java
package com.team.backend.service.ai.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.config.AiUpstreamException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class RecommendationAiClient {

    private final RestTemplate aiRestTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.blend-ratio-path:/recommend/blend-ratio}")
    private String blendRatioPath;

    @Value("${ai.material-ratio-path:/recommend/material_ratio}")
    private String materialRatioPath;

    private static final int MAX_BODY_LOG_CHARS = 3000;

    public RecommendationAiClient(
            @Qualifier("aiRestTemplate") RestTemplate aiRestTemplate,
            ObjectMapper objectMapper
    ) {
        this.aiRestTemplate = aiRestTemplate;
        this.objectMapper = objectMapper;
    }

    // =========================
    // Public API
    // =========================

    public RecommendationAiDto.BlendRatioResponse recommendBlendRatio(RecommendationAiDto.ComfortBatchRequest req) {
        validateBlendRequest(req);
        return executePost(
                normalizePath(blendRatioPath),
                req,
                RecommendationAiDto.BlendRatioResponse.class,
                "BLEND_RATIO"
        );
    }

    public RecommendationAiDto.MaterialRatioResponse recommendMaterialRatio(RecommendationAiDto.MaterialRatioRequest req) {
        validateMaterialRequest(req);
        return executePost(
                normalizePath(materialRatioPath),
                req,
                RecommendationAiDto.MaterialRatioResponse.class,
                "MATERIAL_RATIO"
        );
    }

    // =========================
    // Core
    // =========================

    private <T> T executePost(String path, Object req, Class<T> responseType, String tag) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<Object> entity = new HttpEntity<>(req, headers);

        log.info("[AI][{}] POST {}", tag, path);
        if (log.isDebugEnabled()) {
            log.debug("[AI][{}] requestBody={}", tag, safeJson(req));
        }

        try {
            ResponseEntity<T> res = aiRestTemplate.exchange(path, HttpMethod.POST, entity, responseType);

            int status = res.getStatusCode().value();
            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                log.warn("[AI][{}] BAD_RESPONSE status={}, body=null", tag, status);
                throw new AiUpstreamException("AI_BAD_RESPONSE", 502, tag + " returned empty body");
            }

            T body = res.getBody();
            Integer resultsCount = extractResultsCount(body);

            log.info("[AI][{}] OK status={}, resultsCount={}", tag, status, resultsCount);
            if (log.isDebugEnabled()) {
                log.debug("[AI][{}] responseBody={}", tag, safeJson(body));
            }

            return body;

        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String raw = safeBody(e);
            log.warn("[AI][{}] HTTP_ERROR status={}, body={}", tag, status, truncate(raw, MAX_BODY_LOG_CHARS));

            throw new AiUpstreamException(
                    "AI_HTTP_" + status,
                    502,
                    tag + " error: status=" + status + ", body=" + truncate(raw, MAX_BODY_LOG_CHARS)
            );

        } catch (ResourceAccessException e) {
            log.warn("[AI][{}] TIMEOUT/CONNECTION_ERROR msg={}", tag, e.getMessage());
            throw new AiUpstreamException("AI_TIMEOUT", 504, tag + " timeout/connection error: " + e.getMessage());

        } catch (RestClientException e) {
            log.warn("[AI][{}] CLIENT_ERROR type={}, msg={}", tag, e.getClass().getSimpleName(), e.getMessage());
            throw new AiUpstreamException("AI_CLIENT_ERROR", 502, tag + " client error: " + e.getMessage());
        }
    }

    // =========================
    // Validation
    // =========================

    /**
     * ✅ BLEND_RATIO (네가 원한 스키마 기준)
     *
     * {
     *   "context": {
     *     "temperature": number,
     *     "humidity": number,
     *     "windSpeed": number,
     *     "cloudAmount": number,
     *     "maxTemperature": number,
     *     "minTemperature": number,
     *     "sky": "CLOUD" ...
     *   },
     *   "items": [{ "clothingId": 1, "cRatio": 50, "thickness": "NORMAL" }]
     * }
     */
    private void validateBlendRequest(RecommendationAiDto.ComfortBatchRequest req) {
        if (req == null) throw new IllegalArgumentException("req is required");
        if (req.context == null) throw new IllegalArgumentException("context is required");
        if (req.items == null || req.items.isEmpty()) throw new IllegalArgumentException("items must not be empty");

        // context 필수
        if (req.context.temperature == null) throw new IllegalArgumentException("context.temperature is required");
        if (req.context.humidity == null) throw new IllegalArgumentException("context.humidity is required");
        if (req.context.windSpeed == null) throw new IllegalArgumentException("context.windSpeed is required");
        if (req.context.cloudAmount == null) throw new IllegalArgumentException("context.cloudAmount is required");
        if (req.context.maxTemperature == null) throw new IllegalArgumentException("context.maxTemperature is required");
        if (req.context.minTemperature == null) throw new IllegalArgumentException("context.minTemperature is required");
        if (req.context.sky == null || req.context.sky.isBlank())
            throw new IllegalArgumentException("context.sky is required");

        // items 필수
        for (RecommendationAiDto.ItemReq it : req.items) {
            if (it == null) throw new IllegalArgumentException("item must not be null");
            if (it.clothingId == null) throw new IllegalArgumentException("clothingId is required");
            if (it.cRatio == null) throw new IllegalArgumentException("cRatio is required");
            if (it.thickness == null || it.thickness.isBlank()) throw new IllegalArgumentException("thickness is required");
        }
    }

    /**
     * MATERIAL_RATIO: items + weather 필수
     * items: clothingId 필수, name(=styleTag) 권장, thicknessLevel/color optional
     */
    private void validateMaterialRequest(RecommendationAiDto.MaterialRatioRequest req) {
        if (req == null) throw new IllegalArgumentException("req is required");
        if (req.weather == null) throw new IllegalArgumentException("weather is required");
        if (req.items == null || req.items.isEmpty()) throw new IllegalArgumentException("items must not be empty");

        for (RecommendationAiDto.MaterialItemReq it : req.items) {
            if (it == null) throw new IllegalArgumentException("item must not be null");
            if (it.clothingId == null) throw new IllegalArgumentException("clothingId is required");
        }
    }

    // =========================
    // Helpers
    // =========================

    private String normalizePath(String p) {
        if (p == null || p.isBlank()) return "/";
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

    private String safeJson(Object obj) {
        try {
            String s = objectMapper.writeValueAsString(obj);
            return truncate(s, MAX_BODY_LOG_CHARS);
        } catch (JsonProcessingException e) {
            return "<json-serialize-failed:" + e.getMessage() + ">";
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        if (s.length() <= max) return s;
        return s.substring(0, max) + "...(truncated)";
    }

    private Integer extractResultsCount(Object body) {
        try {
            if (body instanceof RecommendationAiDto.BlendRatioResponse br) {
                return br.results == null ? 0 : br.results.size();
            }
            if (body instanceof RecommendationAiDto.MaterialRatioResponse mr) {
                return mr.results == null ? 0 : mr.results.size();
            }
        } catch (Exception ignore) {
        }
        return null;
    }
}