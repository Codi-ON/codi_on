// src/main/java/com/team/backend/repository/log/SessionLogJdbcRepository.java
package com.team.backend.repository.log;

import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.api.dto.session.SessionLogResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class SessionLogJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    // ======================
    // 1) INSERT (쓰기)
    // ======================
    public void insert(SessionLogRequestDto dto) {
        String sql = """
            INSERT INTO public.session_log (
                user_id,
                session_id,
                event_type,
                payload
            )
            VALUES (
                :userId,
                :sessionId,
                :eventType,
                CASE
                    WHEN :payloadJson IS NULL THEN NULL
                    ELSE CAST(:payloadJson AS jsonb)
                END
            )
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userId", dto.getUserId())            // null 허용
                .addValue("sessionId", dto.getSessionKey())     // NOT NULL
                .addValue("eventType", dto.getEventType())      // NOT NULL
                .addValue("payloadJson", dto.getPayloadJson()); // null 허용

        jdbc.update(sql, params);
    }

    // ======================
    // 2) SELECT (대시보드용 조회)
    // ======================

    // 최근 N개
    public List<SessionLogResponseDto> findRecent(Integer limit) {
        int resolved = resolveLimit(limit, 1, 200);

        String sql = """
            SELECT id,
                   created_at,
                   user_id,
                   session_id,
                   event_type,
                   CASE
                       WHEN payload IS NULL THEN NULL
                       ELSE payload::text
                   END AS payload_json
            FROM public.session_log
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """;

        return jdbc.query(sql, Map.of("limit", resolved), this::mapRow);
    }

    // 기간 + N개
    public List<SessionLogResponseDto> findByCreatedAtBetween(
            OffsetDateTime from,
            OffsetDateTime to,
            Integer limit
    ) {
        int resolved = resolveLimit(limit, 1, 500);

        String sql = """
            SELECT id,
                   created_at,
                   user_id,
                   session_id,
                   event_type,
                   CASE
                       WHEN payload IS NULL THEN NULL
                       ELSE payload::text
                   END AS payload_json
            FROM public.session_log
            WHERE created_at >= :from
              AND created_at <  :to
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """;

        return jdbc.query(
                sql,
                Map.of(
                        "from",  from,
                        "to",    to,
                        "limit", resolved
                ),
                this::mapRow
        );
    }

    // ======================
    // 내부 helper
    // ======================

    private int resolveLimit(Integer limit, int min, int max) {
        int v = (limit == null ? max : limit);
        if (v < min) v = min;
        if (v > max) v = max;
        return v;
    }

    private SessionLogResponseDto mapRow(ResultSet rs, int rowNum) throws SQLException {
        return SessionLogResponseDto.builder()
                .id(rs.getLong("id"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .userId((Long) rs.getObject("user_id"))
                // Response DTO 필드명이 sessionKey 라고 가정
                .sessionKey(rs.getString("session_id"))
                .eventType(rs.getString("event_type"))
                .payloadJson(rs.getString("payload_json"))
                .build();
    }
}