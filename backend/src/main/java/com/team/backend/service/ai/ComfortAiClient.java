package com.team.backend.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.team.backend.config.AiUpstreamException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Component
public class ComfortAiClient {

    private final RestTemplate aiRestTemplate;

    @Value("${ai.blend-ratio-path:/recommend/blend-ratio}")
    private String blendRatioPath;

    @Value("${ai.material-ratio-path:/recommend/material_ratio}")
    private String materialRatioPath;

    public ComfortAiClient(@Qualifier("aiRestTemplate") RestTemplate aiRestTemplate) {
        this.aiRestTemplate = aiRestTemplate;
    }

    public JsonNode callBlendRatio(JsonNode request) {
        return postJson(normalizePath(blendRatioPath), request);
    }

    public JsonNode callMaterialRatio(JsonNode request) {
        return postJson(normalizePath(materialRatioPath), request);
    }

    private JsonNode postJson(String path, JsonNode body) {
        if (body == null) throw new IllegalArgumentException("request body is required");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<JsonNode> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<JsonNode> res =
                    aiRestTemplate.exchange(path, HttpMethod.POST, entity, JsonNode.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                throw new AiUpstreamException("AI_BAD_RESPONSE", 502, "AI returned empty body");
            }
            return res.getBody();

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
}