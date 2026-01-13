package com.team.backend.service.ai;

import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.service.ai.dto.FeedbackAdaptiveAiClient;
import com.team.backend.service.ai.dto.FeedbackAdaptiveAiDto;
import com.team.backend.service.log.RecommendationEventLogService;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

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
        if (req == null) throw new IllegalArgumentException("request is null");
        if (sessionKey == null || sessionKey.isBlank()) throw new IllegalArgumentException("sessionKey is required");

        // AI 계약: year/month 필수
        if (year == null || month == null) {
            throw new IllegalArgumentException("year and month are required");
        }

        String normalizedKey = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(normalizedKey);

        // feedbackId 없으면 발급
        if (req.feedbackId == null) req.feedbackId = UUID.randomUUID();

        // range 없으면 year/month로 생성
        if (req.range == null || req.range.from == null || req.range.to == null) {
            LocalDate from = LocalDate.of(year, month, 1);
            LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
            req.range = new FeedbackAdaptiveAiDto.Range();
            req.range.from = from;
            req.range.to = to;
        }

        if (req.prevBias == null) req.prevBias = 50;
        if (req.prevBias < 0 || req.prevBias > 100) throw new IllegalArgumentException("prevBias must be 0~100");
        if (req.samples == null || req.samples.isEmpty()) throw new IllegalArgumentException("samples is required");

        safeRecoEvent(
                normalizedKey,
                req.feedbackId,
                RecommendationEventType.FEEDBACK_ADAPTIVE_REQUESTED.name(),
                Map.of(
                        "year", year,
                        "month", month,
                        "range", Map.of("from", req.range.from, "to", req.range.to),
                        "prevBias", req.prevBias,
                        "sampleCount", req.samples.size(),
                        "requestModels", req.requestModels
                )
        );

        try {
            FeedbackAdaptiveAiDto.AdaptiveResponse res =
                    aiClient.adaptive(normalizedKey, year, month, req);

            safeRecoEvent(
                    normalizedKey,
                    req.feedbackId,
                    RecommendationEventType.FEEDBACK_ADAPTIVE_SUCCEEDED.name(),
                    Map.of(
                            "userBias", res == null ? null : res.userBias,
                            "models", res == null ? null : res.models
                    )
            );

            return res;

        } catch (Exception e) {
            safeRecoEvent(
                    normalizedKey,
                    req.feedbackId,
                    RecommendationEventType.FEEDBACK_ADAPTIVE_FAILED.name(),
                    Map.of("message", e.getMessage())
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
}