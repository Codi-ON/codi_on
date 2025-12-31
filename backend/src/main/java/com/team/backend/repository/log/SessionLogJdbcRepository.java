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
    // 1) INSERT
    // - occurred_at: 이벤트 발생 시각(앱 기준)
    // - created_at : DB 적재 시각(기본 now())
    // ======================
    public void insert(SessionLogRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("SessionLogRequestDto is null");

        String sessionKey = requireSessionKey(dto.getSessionKey());

        String sql = """
            INSERT INTO public.session_log (
                occurred_at,
                session_key,
                event_type,
                payload,
                created_at
            )
            VALUES (
                :occurredAt,
                :sessionKey,
                :eventType,
                CASE
                    WHEN :payloadJson IS NULL THEN NULL
                    ELSE CAST(:payloadJson AS jsonb)
                END,
                now()
            )
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("occurredAt", dto.getOccurredAt() != null ? dto.getOccurredAt() : OffsetDateTime.now())
                .addValue("sessionKey", sessionKey)
                .addValue("eventType", dto.getEventType().name())
                .addValue("payloadJson", dto.getPayloadJson());

        jdbc.update(sql, params);
    }

    private String requireSessionKey(String raw) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException("sessionKey is required");
        return raw.trim();
    }

    // ======================
    // 2) SELECT (대시보드)
    // ======================

    public List<SessionLogResponseDto> findRecent(Integer limit) {
        int resolved = resolveLimit(limit, 1, 200);

        String sql = """
            SELECT
                id,
                created_at,
                session_key,
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

    /**
     * created_at 기준 range
     * - Service에서 TimeRanges의 [fromInclusive, toExclusive) 넘기면 그대로 맞음
     */
    public List<SessionLogResponseDto> findByCreatedAtBetween(
            OffsetDateTime fromInclusive,
            OffsetDateTime toExclusive,
            Integer limit
    ) {
        int resolved = resolveLimit(limit, 1, 1000);

        String sql = """
            SELECT
                id,
                created_at,
                session_key,
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
                Map.of("from", fromInclusive, "to", toExclusive, "limit", resolved),
                this::mapRow
        );
    }

    /**
     * occurred_at 기준 range (추천)
     */
    public List<SessionLogResponseDto> findByOccurredAtBetween(
            OffsetDateTime fromInclusive,
            OffsetDateTime toExclusive,
            Integer limit
    ) {
        int resolved = resolveLimit(limit, 1, 1000);

        String sql = """
            SELECT
                id,
                created_at,
                session_key,
                event_type,
                CASE
                    WHEN payload IS NULL THEN NULL
                    ELSE payload::text
                END AS payload_json
            FROM public.session_log
            WHERE occurred_at >= :from
              AND occurred_at <  :to
            ORDER BY occurred_at DESC, id DESC
            LIMIT :limit
            """;

        return jdbc.query(
                sql,
                Map.of("from", fromInclusive, "to", toExclusive, "limit", resolved),
                this::mapRow
        );
    }

    // ======================
    // helpers
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
                .sessionKey(rs.getString("session_key"))
                .eventType(rs.getString("event_type"))
                .payloadJson(rs.getString("payload_json"))
                // userId 컬럼이 DB에 없으니 null 유지 (DTO가 userId 들고 있으면 그대로 null 세팅)
                .userId(null)
                .build();
    }
}