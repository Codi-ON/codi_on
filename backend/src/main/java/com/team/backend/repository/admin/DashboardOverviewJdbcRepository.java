// src/main/java/com/team/backend/repository/admin/DashboardOverviewJdbcRepository.java
package com.team.backend.repository.admin;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class DashboardOverviewJdbcRepository {

    private static final String KST = "Asia/Seoul";

    // session_log event_type
    private static final String S_START = "START";
    private static final String S_END   = "END";
    private static final String S_ERROR = "ERROR";

    /**
     * recommendation_event_log event_type (실데이터 기준)
     * - 레거시/변형 이름까지 흡수하려고 LIST로 처리
     */
    private static final List<String> R_GENERATED_LIST = List.of(
            "RECO_GENERATED",
            "RECO_TODAY_GENERATED",
            "RECO_SHOWN"
    );

    private static final List<String> R_EMPTY_LIST = List.of(
            "RECO_EMPTY",
            "RECO_TODAY_EMPTY"
    );

    // funnel (요구사항: 체크리스트 → 추천 → 피드백)
    private static final String F_CHECKLIST = "CHECKLIST_SUBMITTED";
    private static final List<String> F_RECO_LIST = List.of(
            "RECO_GENERATED",
            "RECO_TODAY_GENERATED",
            "RECO_SHOWN"
    );
    private static final String F_FEEDBACK = "RECO_FEEDBACK_SUBMITTED";
    private static final String F_SELECTED = "RECO_ITEM_SELECTED"; // 있으면 같이 집계 (없으면 0)

    private final NamedParameterJdbcTemplate jdbc;

    // =========================
    // Public APIs
    // =========================

    public SummaryRow findSummary(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              (SELECT COUNT(*)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS total_session_events,

              (SELECT COUNT(*) FILTER (WHERE event_type = :S_START)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS total_sessions,

              (SELECT COUNT(DISTINCT COALESCE(user_id::text, session_key))
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND COALESCE(user_id::text, session_key) IS NOT NULL
                  AND COALESCE(user_id::text, session_key) <> '') AS unique_users,

              (SELECT COUNT(*) FILTER (WHERE event_type = :S_ERROR)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS error_events,

              (SELECT COUNT(*) FILTER (WHERE event_type = :S_START)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS started_sessions,

              (SELECT COUNT(*) FILTER (WHERE event_type = :S_END)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS ended_sessions,

              (SELECT COUNT(*)
                 FROM public.item_click_log
                WHERE created_at >= :from AND created_at < :to) AS total_clicks,

              (SELECT COUNT(*)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to) AS total_reco_events,

              (SELECT COUNT(*) FILTER (WHERE event_type IN (:R_EMPTY_LIST))
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to) AS reco_empty,

              (SELECT COUNT(*) FILTER (WHERE event_type IN (:R_GENERATED_LIST))
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to) AS reco_generated
            """;

        MapSqlParameterSource p = baseParams(from, to)
                .addValue("S_START", S_START)
                .addValue("S_END", S_END)
                .addValue("S_ERROR", S_ERROR)
                .addValue("R_EMPTY_LIST", R_EMPTY_LIST)
                .addValue("R_GENERATED_LIST", R_GENERATED_LIST);

        FunnelRow funnel = findFunnel(from, to);
        double returningRate = findReturningRate(from, to);

        try {
            return jdbc.queryForObject(sql, p, (rs, rowNum) -> {
                long totalSessionEvents = rs.getLong("total_session_events");
                long totalSessions      = rs.getLong("total_sessions");
                long uniqueUsers        = rs.getLong("unique_users");

                double avgSessionsPerUser =
                        (uniqueUsers == 0) ? 0.0 : round2((double) totalSessions / (double) uniqueUsers);

                long startedSessions = rs.getLong("started_sessions");
                long endedSessions   = rs.getLong("ended_sessions");
                double sessionEndRate =
                        (startedSessions == 0) ? 0.0 : round2((double) endedSessions * 100.0 / (double) startedSessions);

                long recoEmpty     = rs.getLong("reco_empty");
                long recoGenerated = rs.getLong("reco_generated");
                long denom = recoEmpty + recoGenerated;
                double recoEmptyRate =
                        (denom == 0) ? 0.0 : round2((double) recoEmpty * 100.0 / (double) denom);

                return new SummaryRow(
                        totalSessionEvents,
                        totalSessions,
                        uniqueUsers,
                        avgSessionsPerUser,

                        rs.getLong("total_clicks"),
                        rs.getLong("total_reco_events"),

                        rs.getLong("error_events"),

                        startedSessions,
                        endedSessions,
                        sessionEndRate,

                        recoEmpty,
                        recoGenerated,
                        recoEmptyRate,

                        returningRate,
                        funnel
                );
            });
        } catch (EmptyResultDataAccessException e) {
            return new SummaryRow(
                    0, 0, 0, 0.0,
                    0, 0,
                    0,
                    0, 0, 0.0,
                    0, 0, 0.0,
                    0.0,
                    new FunnelRow(0, 0, 0, 0, 0.0, 0.0, 0.0, 0.0)
            );
        }
    }

    public double findReturningRate(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            WITH per_user AS (
              SELECT
                COALESCE(user_id::text, session_key) AS user_key,
                COUNT(*) FILTER (WHERE event_type = :S_START) AS starts
              FROM public.session_log
              WHERE created_at >= :from
                AND created_at <  :to
                AND COALESCE(user_id::text, session_key) IS NOT NULL
                AND COALESCE(user_id::text, session_key) <> ''
              GROUP BY COALESCE(user_id::text, session_key)
            )
            SELECT
              COUNT(*) AS active_users,
              COUNT(*) FILTER (WHERE starts >= 2) AS returning_users
            FROM per_user
            """;

        MapSqlParameterSource p = baseParams(from, to).addValue("S_START", S_START);

        try {
            return jdbc.queryForObject(sql, p, (rs, rowNum) -> {
                long active = rs.getLong("active_users");
                long returning = rs.getLong("returning_users");
                return (active == 0) ? 0.0 : round2((double) returning * 100.0 / (double) active);
            });
        } catch (EmptyResultDataAccessException e) {
            return 0.0;
        }
    }

    /**
     * 퍼널: 체크리스트 → 추천(생성/노출) → 피드백(제출)
     * + 옵션으로 "아이템 선택"도 같이 보여주면 쓸 수 있게 포함
     */
    public FunnelRow findFunnel(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              COALESCE(COUNT(*) FILTER (WHERE event_type = :CHECKLIST), 0)          AS checklist_submitted,
              COALESCE(COUNT(*) FILTER (WHERE event_type IN (:RECO_LIST)), 0)      AS reco_shown,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :FEEDBACK), 0)          AS feedback_requested,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :SELECTED), 0)          AS item_selected
            FROM public.recommendation_event_log
            WHERE created_at >= :from
              AND created_at <  :to
            """;

        MapSqlParameterSource p = baseParams(from, to)
                .addValue("CHECKLIST", F_CHECKLIST)
                .addValue("RECO_LIST", F_RECO_LIST)
                .addValue("FEEDBACK", F_FEEDBACK)
                .addValue("SELECTED", F_SELECTED);

        try {
            return jdbc.queryForObject(sql, p, (rs, rowNum) -> {
                long checklist = rs.getLong("checklist_submitted");
                long shown     = rs.getLong("reco_shown");
                long feedback  = rs.getLong("feedback_requested");
                long selected  = rs.getLong("item_selected");

                double checklistToShown    = rate100(shown, checklist);
                double shownToFeedback     = rate100(feedback, shown);
                double checklistToFeedback = rate100(feedback, checklist);
                double shownToSelect       = rate100(selected, shown);

                return new FunnelRow(
                        checklist, shown, feedback, selected,
                        checklistToShown, shownToFeedback, checklistToFeedback, shownToSelect
                );
            });
        } catch (EmptyResultDataAccessException e) {
            return new FunnelRow(0, 0, 0, 0, 0.0, 0.0, 0.0, 0.0);
        }
    }

    public List<DailySessionRow> findDailySessions(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              (created_at AT TIME ZONE '%s')::date AS d,
              COUNT(*) AS session_event_count,
              COUNT(DISTINCT COALESCE(user_id::text, session_key))
                FILTER (WHERE COALESCE(user_id::text, session_key) IS NOT NULL
                         AND COALESCE(user_id::text, session_key) <> '') AS unique_user_count,
              COUNT(*) FILTER (WHERE event_type = :S_ERROR) AS error_event_count
            FROM public.session_log
            WHERE created_at >= :from
              AND created_at <  :to
            GROUP BY d
            ORDER BY d
            """.formatted(KST);

        MapSqlParameterSource p = baseParams(from, to).addValue("S_ERROR", S_ERROR);

        return jdbc.query(sql, p, (rs, rowNum) -> {
            long events = rs.getLong("session_event_count");
            long errors = rs.getLong("error_event_count");
            double errorRate = (events == 0) ? 0.0 : round2((double) errors * 100.0 / (double) events);

            return new DailySessionRow(
                    rs.getObject("d", LocalDate.class),
                    events,
                    rs.getLong("unique_user_count"),
                    errors,
                    errorRate
            );
        });
    }

    public List<DailyClickRow> findDailyClicks(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              (created_at AT TIME ZONE '%s')::date AS d,
              COUNT(*) AS click_count
            FROM public.item_click_log
            WHERE created_at >= :from
              AND created_at <  :to
            GROUP BY d
            ORDER BY d
            """.formatted(KST);

        return jdbc.query(sql, baseParams(from, to), (rs, rowNum) ->
                new DailyClickRow(
                        rs.getObject("d", LocalDate.class),
                        rs.getLong("click_count")
                )
        );
    }

    public List<TopClickedItemRow> findTopClickedItems(OffsetDateTime from, OffsetDateTime to, int topN) {
        String sql = """
            SELECT
              i.id AS item_id,
              COALESCE(i.name, '(unknown)') AS name,
              COUNT(*) AS click_count
            FROM public.item_click_log l
            JOIN public.clothing_item i
              ON i.clothing_id = l.clothing_id
            WHERE l.created_at >= :from
              AND l.created_at <  :to
              AND l.clothing_id IS NOT NULL
            GROUP BY i.id, i.name
            ORDER BY click_count DESC
            LIMIT :topN
            """;

        MapSqlParameterSource p = baseParams(from, to).addValue("topN", topN);

        return jdbc.query(sql, p, (rs, rowNum) ->
                new TopClickedItemRow(
                        rs.getLong("item_id"),
                        rs.getString("name"),
                        rs.getLong("click_count")
                )
        );
    }

    // =========================
    // Rows
    // =========================

    @Getter
    @AllArgsConstructor
    public static class SummaryRow {
        private final long totalSessionEvents;
        private final long totalSessions;
        private final long uniqueUsers;
        private final double avgSessionsPerUser;

        private final long totalClicks;
        private final long totalRecoEvents;

        private final long errorEvents;

        private final long startedSessions;
        private final long endedSessions;
        private final double sessionEndRate;

        private final long recoEmpty;
        private final long recoGenerated;
        private final double recoEmptyRate;

        private final double returningRate;

        private final FunnelRow funnel;
    }

    @Getter
    @AllArgsConstructor
    public static class FunnelRow {
        private final long checklistSubmitted;
        private final long recoShown;
        private final long feedbackRequested;
        private final long itemSelected;

        private final double checklistToShownRate;
        private final double shownToFeedbackRate;
        private final double checklistToFeedbackRate;
        private final double shownToSelectRate;
    }

    @Getter
    @AllArgsConstructor
    public static class DailySessionRow {
        private final LocalDate date;
        private final long sessionEventCount;
        private final long uniqueUserCount;
        private final long errorEventCount;
        private final double errorRate;
    }

    @Getter
    @AllArgsConstructor
    public static class DailyClickRow {
        private final LocalDate date;
        private final long clickCount;
    }

    @Getter
    @AllArgsConstructor
    public static class TopClickedItemRow {
        private final long itemId;     // clothing_item.id (PK)
        private final String name;
        private final long clickCount;
    }

    // =========================
    // Utils
    // =========================

    private static MapSqlParameterSource baseParams(OffsetDateTime from, OffsetDateTime to) {
        return new MapSqlParameterSource()
                .addValue("from", from)
                .addValue("to", to);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static double rate100(long numerator, long denominator) {
        if (denominator <= 0) return 0.0;
        return round2((double) numerator * 100.0 / (double) denominator);
    }
}