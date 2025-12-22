// src/main/java/com/team/backend/repository/admin/DashboardRecommendationMetricsJdbcRepository.java
package com.team.backend.repository.admin;

import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

@Repository
@RequiredArgsConstructor
public class DashboardRecommendationMetricsJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    @Getter
    @AllArgsConstructor
    public static class FunnelCounts {
        private final long checklistSubmitted;
        private final long recoGenerated;
        private final long recoShown;
        private final long itemSelected;
        private final long feedbackSubmitted;
        private final long recoCompleted;

        // 퍼널 비율(요청한 핵심)
        public double checklistToShownRate() { return rate(recoShown, checklistSubmitted); }
        public double shownToSelectRate()    { return rate(itemSelected, recoShown); }
        public double selectToFeedbackRate() { return rate(feedbackSubmitted, itemSelected); }
        public double shownToFeedbackRate()  { return rate(feedbackSubmitted, recoShown); }
    }

    public FunnelCounts fetchFunnelCounts(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              COALESCE(COUNT(*) FILTER (WHERE event_type = :CHECKLIST_SUBMITTED), 0)      AS checklist_submitted,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :RECO_GENERATED), 0)           AS reco_generated,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :RECO_SHOWN), 0)               AS reco_shown,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :RECO_ITEM_SELECTED), 0)       AS reco_item_selected,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :RECO_FEEDBACK_SUBMITTED), 0)  AS reco_feedback_submitted,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :RECO_COMPLETED), 0)           AS reco_completed
            FROM public.recommendation_event_log
            WHERE created_at >= :from
              AND created_at <  :to
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("from", from)
                .addValue("to", to)
                // enum.name() 고정 -> 오타/점(.) 차단
                .addValue("CHECKLIST_SUBMITTED", RecommendationEventType.CHECKLIST_SUBMITTED.name())
                .addValue("RECO_GENERATED", RecommendationEventType.RECO_GENERATED.name())
                .addValue("RECO_SHOWN", RecommendationEventType.RECO_SHOWN.name())
                .addValue("RECO_ITEM_SELECTED", RecommendationEventType.RECO_ITEM_SELECTED.name())
                .addValue("RECO_FEEDBACK_SUBMITTED", RecommendationEventType.RECO_FEEDBACK_SUBMITTED.name())
                .addValue("RECO_COMPLETED", RecommendationEventType.RECO_COMPLETED.name());

        try {
            return jdbc.queryForObject(sql, p, (rs, rowNum) ->
                    new FunnelCounts(
                            rs.getLong("checklist_submitted"),
                            rs.getLong("reco_generated"),
                            rs.getLong("reco_shown"),
                            rs.getLong("reco_item_selected"),
                            rs.getLong("reco_feedback_submitted"),
                            rs.getLong("reco_completed")
                    )
            );
        } catch (EmptyResultDataAccessException e) {
            // 집계 쿼리는 보통 1 row 반환이지만, 운영에서 안전하게 0으로 방어
            return new FunnelCounts(0, 0, 0, 0, 0, 0);
        }
    }

    private static double rate(long numerator, long denominator) {
        if (denominator <= 0) return 0.0;
        return (double) numerator / (double) denominator;
    }
}