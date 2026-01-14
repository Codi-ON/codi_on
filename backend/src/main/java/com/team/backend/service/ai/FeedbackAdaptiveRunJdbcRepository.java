// src/main/java/com/team/backend/service/ai/FeedbackAdaptiveRunJdbcRepository.java
package com.team.backend.service.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class FeedbackAdaptiveRunJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public void upsertRequested(
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
        String sql = """
            INSERT INTO public.feedback_adaptive_run (
              feedback_id, session_key, year, month,
              range_from, range_to, prev_bias, request_models,
              status, requested_at, request_json,
              created_at, updated_at
            )
            VALUES (
              :feedbackId, :sessionKey, :year, :month,
              :rangeFrom, :rangeTo, :prevBias, :requestModels,
              'REQUESTED', NOW(), CAST(:requestJson AS jsonb),
              NOW(), NOW()
            )
            ON CONFLICT (feedback_id) DO UPDATE
            SET session_key    = EXCLUDED.session_key,
                year           = EXCLUDED.year,
                month          = EXCLUDED.month,
                range_from      = EXCLUDED.range_from,
                range_to        = EXCLUDED.range_to,
                prev_bias       = EXCLUDED.prev_bias,
                request_models  = EXCLUDED.request_models,
                status         = 'REQUESTED',
                requested_at   = NOW(),
                request_json   = EXCLUDED.request_json,
                updated_at     = NOW()
            """;

        String[] modelsArr = (requestModels == null) ? null : requestModels.toArray(new String[0]);

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("feedbackId", feedbackId)
                .addValue("sessionKey", sessionKey)
                .addValue("year", year)
                .addValue("month", month)
                .addValue("rangeFrom", rangeFrom)
                .addValue("rangeTo", rangeTo)
                .addValue("prevBias", prevBias == null ? 50 : prevBias)
                .addValue("requestModels", modelsArr)
                .addValue("requestJson", (requestJson == null || requestJson.isBlank()) ? "{}" : requestJson);

        jdbc.update(sql, p);
    }

    public void markSucceeded(UUID feedbackId, long latencyMs, String responseJson) {
        String sql = """
            UPDATE public.feedback_adaptive_run
            SET status        = 'SUCCEEDED',
                succeeded_at  = NOW(),
                latency_ms    = :latencyMs,
                response_json = CAST(:responseJson AS jsonb),
                updated_at    = NOW()
            WHERE feedback_id = :feedbackId
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("feedbackId", feedbackId)
                .addValue("latencyMs", latencyMs)
                .addValue("responseJson", (responseJson == null || responseJson.isBlank()) ? "{}" : responseJson);

        jdbc.update(sql, p);
    }

    public void markFailed(UUID feedbackId, String errorJson) {
        String sql = """
            UPDATE public.feedback_adaptive_run
            SET status     = 'FAILED',
                failed_at  = NOW(),
                error_json = CAST(:errorJson AS jsonb),
                updated_at = NOW()
            WHERE feedback_id = :feedbackId
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("feedbackId", feedbackId)
                .addValue("errorJson", (errorJson == null || errorJson.isBlank()) ? "{}" : errorJson);

        jdbc.update(sql, p);
    }
}