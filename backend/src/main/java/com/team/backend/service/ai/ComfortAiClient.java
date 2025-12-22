package com.team.backend.service.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.team.backend.config.AiUpstreamException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class ComfortAiClient {

    private final RestTemplate restTemplate;

    private final String baseUrl;
    private final int connectTimeoutMs;
    private final int readTimeoutMs;

    public ComfortAiClient(
            @Value("${ai.base-url:http://ai:8000}") String baseUrl,
            @Value("${ai.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${ai.read-timeout-ms:7000}") int readTimeoutMs
    ) {
        this.baseUrl = stripTrailingSlash(baseUrl);
        this.connectTimeoutMs = connectTimeoutMs;
        this.readTimeoutMs = readTimeoutMs;

        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(this.connectTimeoutMs);
        f.setReadTimeout(this.readTimeoutMs);
        this.restTemplate = new RestTemplate(f);
    }

    /**
     * 기존 서비스 코드 호환용
     */
    public BatchResponse callBatch(BatchRequest request) {
        validateRequest(request);

        // B안 핵심: ratio 이상해도 예외 던지지 말고 "항상 100"으로 정규화해서 보낸다
        BatchRequest sanitized = sanitizeRequest(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<BatchRequest> entity = new HttpEntity<>(sanitized, headers);

        String url = baseUrl + "/comfort/batch";

        try {
            ResponseEntity<BatchResponse> res =
                    restTemplate.exchange(url, HttpMethod.POST, entity, BatchResponse.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                throw new AiUpstreamException("AI_BAD_RESPONSE", 502, "AI returned empty body");
            }
            if (res.getBody().results == null) {
                res.getBody().results = List.of();
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

    private void validateRequest(BatchRequest request) {
        if (request == null) throw new IllegalArgumentException("request is required");
        if (request.context == null) throw new IllegalArgumentException("context is required");
        if (request.items == null || request.items.isEmpty()) throw new IllegalArgumentException("items must not be empty");

        for (Item it : request.items) {
            if (it == null) throw new IllegalArgumentException("item must not be null");
            if (it.itemId == null) throw new IllegalArgumentException("item_id is required");
            if (it.cRatio == null || it.pRatio == null) throw new IllegalArgumentException("c_ratio and p_ratio are required");
            if (it.cRatio < 0 || it.cRatio > 100 || it.pRatio < 0 || it.pRatio > 100) {
                throw new IllegalArgumentException("c_ratio and p_ratio must be between 0 and 100");
            }
            // sum=100 체크로 throw 금지 (B안)
        }
    }

    private BatchRequest sanitizeRequest(BatchRequest request) {
        Context c = request.context;
        Context ctx = new Context(
                nz(c.ta), nz(c.rh), nz(c.va), nz(c.cloud)
        );

        List<Item> items = request.items.stream()
                .map(it -> {
                    int[] rp = normalizeTo100(it.cRatio, it.pRatio);
                    return new Item(it.itemId, rp[0], rp[1]);
                })
                .collect(Collectors.toList());

        return new BatchRequest(ctx, items);
    }

    private double nz(Double v) {
        return (v == null || !Double.isFinite(v)) ? 0.0 : v;
    }

    /**
     * 어떤 값이 와도 "0~100" + "합 100"으로 보정
     */
    private int[] normalizeTo100(Integer cRatio, Integer pRatio) {
        int c = clamp01_100(cRatio);
        int p = clamp01_100(pRatio);
        int sum = c + p;

        if (sum == 100) return new int[]{c, p};

        if (sum <= 0) return new int[]{50, 50};

        // 비율 유지 스케일링 후, 마지막은 100 맞춤
        int c2 = (int) Math.round((c * 100.0) / sum);
        c2 = Math.max(0, Math.min(100, c2));
        int p2 = 100 - c2;
        return new int[]{c2, p2};
    }

    private int clamp01_100(Integer v) {
        int x = (v == null ? 0 : v);
        if (x < 0) return 0;
        return Math.min(x, 100);
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

    private String stripTrailingSlash(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    // ============================
    // DTO
    // ============================

    public static class BatchRequest {
        @JsonProperty("context")
        public Context context;

        @JsonProperty("items")
        public List<Item> items;

        public BatchRequest() {}
        public BatchRequest(Context context, List<Item> items) {
            this.context = context;
            this.items = items;
        }
    }

    public static class BatchResponse {
        @JsonProperty("results")
        public List<Result> results;
    }

    public static class Context {
        @JsonProperty("Ta")
        public double ta;

        @JsonProperty("RH")
        public double rh;

        @JsonProperty("Va")
        public double va;

        @JsonProperty("cloud")
        public double cloud;

        public Context() {}
        public Context(double ta, double rh, double va, double cloud) {
            this.ta = ta;
            this.rh = rh;
            this.va = va;
            this.cloud = cloud;
        }
    }

    public static class Item {
        @JsonProperty("item_id")
        public Long itemId;

        @JsonProperty("c_ratio")
        public Integer cRatio;

        @JsonProperty("p_ratio")
        public Integer pRatio;

        public Item() {}
        public Item(Long itemId, Integer cRatio, Integer pRatio) {
            this.itemId = itemId;
            this.cRatio = cRatio;
            this.pRatio = pRatio;
        }
    }

    public static class Result {
        @JsonProperty("item_id")
        public Long itemId;

        @JsonProperty("comfort_score")
        public Double comfortScore;

        @JsonProperty("error")
        public String error;
    }
}