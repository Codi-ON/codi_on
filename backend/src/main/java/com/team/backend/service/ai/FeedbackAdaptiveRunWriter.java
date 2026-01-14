// src/main/java/com/team/backend/service/ai/FeedbackAdaptiveRunWriter.java
package com.team.backend.service.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedbackAdaptiveRunWriter {

    private final FeedbackAdaptiveRunJdbcRepository repo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void requested(
            UUID feedbackId,
            String sessionKey,
            int year,
            int month,
            LocalDate rangeFrom,
            LocalDate rangeTo,
            Integer prevBias,
            List<String> requestModels,
            String requestJson
    ) {
        repo.upsertRequested(feedbackId, sessionKey, year, month, rangeFrom, rangeTo, prevBias, requestModels, requestJson);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void succeeded(UUID feedbackId, long latencyMs, String responseJson) {
        repo.markSucceeded(feedbackId, latencyMs, responseJson);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void failed(UUID feedbackId, String errorJson) {
        repo.markFailed(feedbackId, errorJson);
    }
}