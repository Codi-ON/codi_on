package com.team.backend.service.ai;

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

    public FeedbackAdaptiveAiDto.AdaptiveResponse adaptive(
            String sessionKey,
            Integer year,
            Integer month,
            FeedbackAdaptiveAiDto.AdaptiveRequest req
    ) {
        final long startedAt = System.currentTimeMillis();
        final String traceId = UUID.randomUUID().toString().substring(0, 8); // 로그 상관관계

        // 0) 입력 기본 검증
        if (req == null) throw new IllegalArgumentException("request is null");
        if (sessionKey == null || sessionKey.isBlank()) throw new IllegalArgumentException("sessionKey is required");

        // 1) year/month 파생: (기존 정책 유지) -> 없으면 range.from으로 보완
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

        // 2) 세션 검증
        String normalizedKey = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(normalizedKey);

        // 3) feedbackId 없으면 발급
        if (req.feedbackId == null) req.feedbackId = UUID.randomUUID();

        // 4) range 없으면 year/month로 생성
        if (req.range == null || req.range.from == null || req.range.to == null) {
            LocalDate from = LocalDate.of(y, m, 1);
            LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
            req.range = new FeedbackAdaptiveAiDto.Range();
            req.range.from = from;
            req.range.to = to;
        }

        // 5) 입력 유효성 (신규 계약: weather/items 필수)
        if (req.prevBias == null) req.prevBias = 50;
        if (req.prevBias < 0 || req.prevBias > 100) throw new IllegalArgumentException("prevBias must be 0~100");
        if (req.weather == null) throw new IllegalArgumentException("weather is required");
        if (req.items == null || req.items.isEmpty()) throw new IllegalArgumentException("items is required");
        if (req.samples == null || req.samples.isEmpty()) throw new IllegalArgumentException("samples is required");

        // 6) 요청 로깅(요약)
        Map<String, Object> requestSummary = new LinkedHashMap<>();
        requestSummary.put("traceId", traceId);
        requestSummary.put("year", y);
        requestSummary.put("month", m);
        requestSummary.put("feedbackId", req.feedbackId);
        requestSummary.put("range", Map.of("from", req.range.from, "to", req.range.to));
        requestSummary.put("prevBias", req.prevBias);
        requestSummary.put("itemCount", req.items.size());
        requestSummary.put("sampleCount", req.samples.size());
        requestSummary.put("requestModels", req.requestModels);

        // weather는 핵심 필드만
        requestSummary.put("weather",
                Map.of(
                        "t", req.weather.temperature,
                        "feels", req.weather.feelsLikeTemperature,
                        "min", req.weather.minTemperature,
                        "max", req.weather.maxTemperature,
                        "humidity", req.weather.humidity,
                        "wind", req.weather.windSpeed,
                        "cloud", req.weather.cloudAmount,
                        "pop", req.weather.precipitationProbability,
                        "sky", req.weather.sky
                )
        );

        // items는 전체를 로그에 넣지 말고 샘플만
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

        safeRecoEvent(
                normalizedKey,
                req.feedbackId,
                RecommendationEventType.FEEDBACK_ADAPTIVE_REQUESTED.name(),
                requestSummary
        );

        // 7) AI 호출 + 응답 요약
        try {
            final long callStart = System.currentTimeMillis();
            FeedbackAdaptiveAiDto.AdaptiveResponse res = aiClient.adaptive(normalizedKey, y, m, req);
            final long callMs = System.currentTimeMillis() - callStart;

            Map<String, Object> responseSummary = new LinkedHashMap<>();
            responseSummary.put("traceId", traceId);
            responseSummary.put("latencyMs", callMs);
            responseSummary.put("userBias", res == null ? null : res.userBias);

            if (res == null || res.models == null) {
                responseSummary.put("models", null);
            } else {
                // 모델별 result size만 요약
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

            safeRecoEvent(
                    normalizedKey,
                    req.feedbackId,
                    RecommendationEventType.FEEDBACK_ADAPTIVE_SUCCEEDED.name(),
                    responseSummary
            );

            log.info("[FeedbackAdaptive][{}] DONE totalMs={}", traceId, (System.currentTimeMillis() - startedAt));
            return res;

        } catch (Exception e) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("traceId", traceId);
            err.put("errorClass", e.getClass().getName());
            err.put("message", e.getMessage());
            err.put("rootCause", rootCauseMessage(e));
            err.put("totalMs", (System.currentTimeMillis() - startedAt));

            log.error("[FeedbackAdaptive][{}] FAILED {}", traceId, err, e);

            safeRecoEvent(
                    normalizedKey,
                    req.feedbackId,
                    RecommendationEventType.FEEDBACK_ADAPTIVE_FAILED.name(),
                    err
            );
            throw e;
        }
    }

    // recommendation_event_log 적재(메인 플로우 방해 금지)
    private void safeRecoEvent(String sessionKey, UUID recommendationId, String eventType, Map<String, Object> payloadObj) {
        try {
            RecommendationEventLogRequestDto dto = RecommendationEventLogRequestDto.builder()
                    .sessionKey(sessionKey)
                    .recommendationId(recommendationId) // feedbackId를 그대로 recommendation_id로 사용
                    .funnelStep("FEEDBACK_ADAPTIVE")
                    .eventType(eventType)
                    .payload(payloadObj == null ? null : new LinkedHashMap<>(payloadObj))
                    .build();

            eventLogService.write(dto);
        } catch (Exception ignore) {
            // 로그 실패가 메인 흐름 깨면 안 됨
        }
    }

    private String rootCauseMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null) cur = cur.getCause();
        return cur.getMessage();
    }
}