package com.team.backend.repository.checklist;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ChecklistJdbcRepository {

    private static final String KST = "Asia/Seoul";
    private static final String EVENT_CHECKLIST_SUBMITTED = "CHECKLIST_SUBMITTED";

    private final NamedParameterJdbcTemplate jdbc;

    /**
     * 오늘(KST) 이미 체크리스트 제출한 recommendation_id가 있으면 반환 (멱등)
     */
    public UUID findTodayChecklistRecommendationId(String sessionKey, LocalDate kstDate) {
        String sql = """
            SELECT recommendation_id
            FROM public.recommendation_event_log
            WHERE session_key = :sessionKey
              AND event_type = :eventType
              AND ((created_at AT TIME ZONE '%s')::date = :kstDate)
              AND recommendation_id IS NOT NULL
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """.formatted(KST);

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("sessionKey", sessionKey)
                .addValue("eventType", EVENT_CHECKLIST_SUBMITTED)
                .addValue("kstDate", kstDate);

        try {
            return jdbc.queryForObject(sql, p, (rs, rowNum) -> (UUID) rs.getObject("recommendation_id"));
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}