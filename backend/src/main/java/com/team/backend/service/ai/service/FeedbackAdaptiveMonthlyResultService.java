package com.team.backend.service.ai.service;// src/main/java/com/team/backend/service/ai/FeedbackAdaptiveMonthlyResultService.java


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.api.dto.feedback.FeedbackAdaptiveMonthlyResultResponseDto;
import com.team.backend.service.ai.repository.FeedbackAdaptiveRunReadJdbcRepository;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackAdaptiveMonthlyResultService {

    private final SessionService sessionService;
    private final FeedbackAdaptiveRunReadJdbcRepository runReadRepo;

    private static final ObjectMapper OM = new ObjectMapper();

    public FeedbackAdaptiveMonthlyResultResponseDto getMonthlyResult(String sessionKey, int year, int month) {
        if (sessionKey == null || sessionKey.isBlank()) {
            throw new IllegalArgumentException("sessionKey is required");
        }

        String normalizedKey = sessionService.validateOnly(sessionKey);

        Optional<FeedbackAdaptiveRunReadJdbcRepository.Row> rowOpt =
                runReadRepo.findLatestBySessionAndYm(normalizedKey, year, month);

        if (rowOpt.isEmpty()) {
            // 404로 해도 되지만, MVP는 200 + null result로 처리
            return FeedbackAdaptiveMonthlyResultResponseDto.builder()
                    .feedbackId(null)
                    .status("NOT_FOUND")
                    .result(null)
                    .build();
        }

        FeedbackAdaptiveRunReadJdbcRepository.Row row = rowOpt.get();
        JsonNode resultNode = null;
        try {
            if (row.getResponseJson() != null && !row.getResponseJson().isBlank()) {
                resultNode = OM.readTree(row.getResponseJson());
            }
        } catch (Exception ignore) {
        }

        return FeedbackAdaptiveMonthlyResultResponseDto.builder()
                .feedbackId(row.getFeedbackId())
                .status(row.getStatus())
                .latencyMs(row.getLatencyMs())
                .requestedAt(row.getRequestedAt())
                .succeededAt(row.getSucceededAt())
                .failedAt(row.getFailedAt())
                .result(resultNode)
                .build();
    }
}