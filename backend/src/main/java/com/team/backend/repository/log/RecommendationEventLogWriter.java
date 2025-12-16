package com.team.backend.repository.log;

import com.team.backend.api.dto.recommendation.RecommendationEventLogWriteRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Slf4j
@Repository
@RequiredArgsConstructor
public class RecommendationEventLogWriter {

    private final NamedParameterJdbcTemplate jdbc;

    private static final String INSERT_SQL = """
        INSERT INTO recommendation_event_log (
            created_at, user_id, session_id, recommendation_id, event_type, payload
        )
        VALUES (
            :createdAt, :userId, :sessionId, :recommendationId, :eventType,
            CASE
              WHEN :payloadJson IS NULL OR :payloadJson = '' THEN NULL
              ELSE CAST(:payloadJson AS jsonb)
            END
        )
        """;

    /**
     * ✅ 로그 적재는 “실패해도 메인 흐름(추천/조회)”을 깨지 않게 설계하는 게 실무에서 흔함
     * - 여기는 예외를 던지지 않고 warn만 찍는 형태(원하면 정책 바꿀 수 있음)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(RecommendationEventLogWriteRequestDto req) {
        try {
            var params = new MapSqlParameterSource()
                    // 서울(+09) 기준으로 저장하고 싶으면 +09로 박아도 되는데
                    // timestamptz는 어차피 UTC로 저장되므로 "now()" 써도 무방.
                    .addValue("createdAt", OffsetDateTime.now(ZoneOffset.UTC))
                    .addValue("userId", req.getUserId())
                    .addValue("sessionId", req.getSessionId())
                    .addValue("recommendationId", req.getRecommendationId())
                    .addValue("eventType", req.getEventType())
                    .addValue("payloadJson", req.getPayloadJson());

            jdbc.update(INSERT_SQL, params);
        } catch (Exception e) {
            log.warn("⚠️ recommendation_event_log insert 실패 (메인 흐름은 유지). eventType={}", req.getEventType(), e);
        }
    }
}