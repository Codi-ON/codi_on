// src/main/java/com/team/backend/service/ai/FeedbackAdaptiveService.java
package com.team.backend.service.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.service.ai.dto.FeedbackAdaptiveAiClient;
import com.team.backend.service.ai.dto.FeedbackAdaptiveAiDto;
import com.team.backend.service.log.RecommendationEventLogService;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FeedbackAdaptiveService {

    private final SessionService sessionService;
    private final FeedbackAdaptiveAiClient aiClient;
    private final RecommendationEventLogService eventLogService;

    // ✅ REQUIRES_NEW 분리 Bean
    private final FeedbackAdaptiveRunWriter runWriter;

    private static final ObjectMapper OM = new ObjectMapper();

    public FeedbackAdaptiveAiDto.AdaptiveResponse adaptive(
            String sessionKey,
            Integer year,
            Integer month,
            FeedbackAdaptiveAiDto.AdaptiveRequest req
    ) {
        final long startedAt = System.currentTimeMillis();
        final String traceId = UUID.randomUUID().toString().substring(0, 8);

        if (req == null) throw new IllegalArgumentException("request is null");
        if (sessionKey == null || sessionKey.isBlank()) throw new IllegalArgumentException("sessionKey is required");

        Integer y = year;
        Integer m = month;
        if (y == null || m == null) {
            if (req.range != null && req.range.from != null) {
                y = req.range.from.getYear();
                m = req.range.from.getMonthValue();
            } else {
                throw new IllegalArgumentException("year and month are required (or range.from)");
            }
        }

        String normalizedKey = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(normalizedKey);

        if (req.feedbackId == null) req.feedbackId = UUID.randomUUID();

        if (req.range == null || req.range.from == null || req.range.to == null) {
            LocalDate from = LocalDate.of(y, m, 1);
            LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
            req.range = new FeedbackAdaptiveAiDto.Range();
            req.range.from = from;
            req.range.to = to;
        }

        if (req.prevBias == null) req.prevBias = 50;
        if (req.prevBias < 0 || req.prevBias > 100) throw new IllegalArgumentException("prevBias must be 0~100");
        if (req.weather == null) throw new IllegalArgumentException("weather is required");
        if (req.items == null || req.items.isEmpty()) throw new IllegalArgumentException("items is required");
        if (req.samples == null || req.samples.isEmpty()) throw new IllegalArgumentException("samples is required");

        Map<String, Object> requestSummary = new LinkedHashMap<>();
        requestSummary.put("traceId", traceId);
        requestSummary.put("year", y);
        requestSummary.put("month", m);
        requestSummary.put("feedbackId", req.feedbackId.toString());
        requestSummary.put("range", Map.of("from", req.range.from.toString(), "to", req.range.to.toString()));
        requestSummary.put("prevBias", req.prevBias);
        requestSummary.put("itemCount", req.items.size());
        requestSummary.put("sampleCount", req.samples.size());
        requestSummary.put("requestModels", req.requestModels);

        requestSummary.put("weather", Map.of(
                "t", req.weather.temperature,
                "feels", req.weather.feelsLikeTemperature,
                "min", req.weather.minTemperature,
                "max", req.weather.maxTemperature,
                "humidity", req.weather.humidity,
                "wind", req.weather.windSpeed,
                "cloud", req.weather.cloudAmount,
                "pop", req.weather.precipitationProbability,
                "sky", req.weather.sky
        ));

        requestSummary.put("itemsSample",
                req.items.stream()
                        .limit(5)
                        .map(it -> Map.of(
                                "clothingId", it.clothingId,
                                "cRatio", it.cRatio,
                                "thickness", it.thickness,
                                "name", it.name,
                                "color", it.color
                        ))
                        .collect(Collectors.toList())
        );

        log.info("[FeedbackAdaptive][{}] REQUEST {}", traceId, requestSummary);

        // ✅ (1) run 테이블 저장: REQUIRES_NEW (타입 오류 방지: req를 넘기고 내부에서 toJson)
        safeRunRequested(req, normalizedKey, y, m);

        // ✅ (2) 이벤트 로그
        safeRecoEvent(normalizedKey, req.feedbackId,
                RecommendationEventType.FEEDBACK_ADAPTIVE_REQUESTED.name(),
                requestSummary
        );

        try {
            final long callStart = System.currentTimeMillis();
            FeedbackAdaptiveAiDto.AdaptiveResponse res = aiClient.adaptive(normalizedKey, y, m, req);
            final long callMs = System.currentTimeMillis() - callStart;

            Map<String, Object> responseSummary = new LinkedHashMap<>();
            responseSummary.put("traceId", traceId);
            responseSummary.put("feedbackId", req.feedbackId.toString());
            responseSummary.put("latencyMs", callMs);
            responseSummary.put("userBias", res == null ? null : res.userBias);

            if (res == null || res.models == null) {
                responseSummary.put("models", null);
            } else {
                List<Map<String, Object>> modelSizes = new ArrayList<>();
                for (FeedbackAdaptiveAiDto.ModelResult mr : res.models) {
                    int size = (mr == null || mr.results == null) ? 0 : mr.results.size();
                    modelSizes.add(Map.of(
                            "modelType", mr == null ? null : mr.modelType,
                            "resultSize", size
                    ));
                }
                responseSummary.put("models", modelSizes);
            }

            log.info("[FeedbackAdaptive][{}] RESPONSE {}", traceId, responseSummary);

            // ✅ (3) run SUCCEEDED: REQUIRES_NEW
            safeRunSucceeded(req.feedbackId, callMs, toJson(res));

            // ✅ (4) 이벤트 로그 SUCCEEDED
            safeRecoEvent(normalizedKey, req.feedbackId,
                    RecommendationEventType.FEEDBACK_ADAPTIVE_SUCCEEDED.name(),
                    responseSummary
            );

            log.info("[FeedbackAdaptive][{}] DONE totalMs={}", traceId, (System.currentTimeMillis() - startedAt));
            return res;

        } catch (Exception e) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("traceId", traceId);
            err.put("feedbackId", req.feedbackId.toString());
            err.put("errorClass", e.getClass().getName());
            err.put("message", e.getMessage());
            err.put("rootCause", rootCauseMessage(e));
            err.put("totalMs", (System.currentTimeMillis() - startedAt));

            log.error("[FeedbackAdaptive][{}] FAILED {}", traceId, err, e);

            // ✅ (5) run FAILED: REQUIRES_NEW
            safeRunFailed(req.feedbackId, toJson(err));

            // ✅ (6) 이벤트 로그 FAILED
            safeRecoEvent(normalizedKey, req.feedbackId,
                    RecommendationEventType.FEEDBACK_ADAPTIVE_FAILED.name(),
                    err
            );

            throw e;
        }
    }

    private void safeRunRequested(FeedbackAdaptiveAiDto.AdaptiveRequest req, String sessionKey, int year, int month) {
        try {
            runWriter.requested(
                    req.feedbackId,
                    sessionKey,
                    year,
                    month,
                    req.range.from,
                    req.range.to,
                    req.prevBias,
                    req.requestModels,
                    toJson(req)
            );
        } catch (Exception ex) {
            log.warn("[FeedbackAdaptiveRun] requested failed feedbackId={} reason={}", req.feedbackId, ex.getMessage());
        }
    }

    private void safeRunSucceeded(UUID feedbackId, long latencyMs, String responseJson) {
        try {
            runWriter.succeeded(feedbackId, latencyMs, responseJson);
        } catch (Exception ex) {
            log.warn("[FeedbackAdaptiveRun] succeeded failed feedbackId={} reason={}", feedbackId, ex.getMessage());
        }
    }

    private void safeRunFailed(UUID feedbackId, String errorJson) {
        try {
            runWriter.failed(feedbackId, errorJson);
        } catch (Exception ex) {
            log.warn("[FeedbackAdaptiveRun] failed failed feedbackId={} reason={}", feedbackId, ex.getMessage());
        }
    }

    private void safeRecoEvent(String sessionKey, UUID feedbackId, String eventType, Map<String, Object> payloadObj) {
        try {
            RecommendationEventLogRequestDto dto = RecommendationEventLogRequestDto.builder()
                    .createdAt(null)
                    .userId(null)
                    .sessionKey(sessionKey)
                    .recommendationId(feedbackId)
                    .funnelStep("FEEDBACK_ADAPTIVE")
                    .eventType(eventType)
                    .payload(payloadObj == null ? null : new LinkedHashMap<>(payloadObj))
                    .build();

            eventLogService.write(dto);
        } catch (Exception ignore) {
        }
    }

    private static String toJson(Object obj) {
        if (obj == null) return "{}";
        try {
            return OM.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{\"serializeError\":true}";
        }
    }

    private String rootCauseMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null) cur = cur.getCause();
        return cur.getMessage();
    }
}