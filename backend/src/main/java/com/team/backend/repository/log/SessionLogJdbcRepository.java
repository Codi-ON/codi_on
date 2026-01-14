package com.team.backend.repository.log;

import com.team.backend.api.dto.log.SessionLogRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class SessionLogJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public void insert(SessionLogRequestDto dto) {
        String sql = """
            INSERT INTO public.session_log (
                created_at,
                session_key,
                user_id,
                event_type,
                payload
            )
            VALUES (
                COALESCE(:createdAt, now()),
                :sessionKey,
                :userId,
                :eventType,
                CASE
                  WHEN :payloadJson IS NULL THEN NULL
                  ELSE CAST(:payloadJson AS jsonb)
                END
            )
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("createdAt", dto.getCreatedAt())
                .addValue("sessionKey", dto.getSessionKey())
                .addValue("userId", dto.getUserId())
                .addValue("eventType", dto.getEventType())
                .addValue("payloadJson", dto.getPayloadJson());

        jdbc.update(sql, p);
    }
}