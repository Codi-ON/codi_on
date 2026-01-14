// src/main/java/com/team/backend/repository/log/SessionLogJdbcRepository.java
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

    /**
     * 전제: public.session_log (부모 테이블)로 INSERT하면
     * 파티션(session_log_YYYYMM)이 있으면 자동 라우팅됨.
     */
    public void insert(SessionLogRequestDto dto) {
        String sql = """
            INSERT INTO public.session_log (
              created_at,
              user_id,
              session_key,
              event_type,
              payload
            )
            VALUES (
              :createdAt,
              :userId,
              :sessionKey,
              :eventType,
              CAST(:payloadJson AS jsonb)
            )
            """;

        String payloadJson = dto.getPayloadJson();
        if (payloadJson == null || payloadJson.isBlank()) payloadJson = "{}";

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("createdAt", dto.getCreatedAt())
                .addValue("userId", dto.getUserId())
                .addValue("sessionKey", dto.getSessionKey())
                .addValue("eventType", dto.getEventType())
                .addValue("payloadJson", payloadJson);

        jdbc.update(sql, p);
    }
}