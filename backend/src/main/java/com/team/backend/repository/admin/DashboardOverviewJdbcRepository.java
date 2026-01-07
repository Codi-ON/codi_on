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

    // recommendation_event_log event_type (string 고정: enum import로 인한 컴파일 깨짐 방지)
    private static final String R_EMPTY      = "RECO_TODAY_EMPTY";
    private static final String R_GENERATED  = "RECO_TODAY_GENERATED";

    // funnel
    private static final String F_CHECKLIST  = "CHECKLIST_SUBMITTED";
    private static final String F_SHOWN      = "RECO_SHOWN";
    private static final String F_SELECTED   = "RECO_ITEM_SELECTED";

    private final NamedParameterJdbcTemplate jdbc;

    // =========================
    // Rows (Service/Mapper에서 DTO로 변환)
    // =========================

    @Getter
    @AllArgsConstructor
    public static class SummaryRow {
        private final long totalSessionEvents;     // session_log row 수
        private final long totalSessions;          // START count
        private final long uniqueUsers;            // distinct session_key (nonblank)
        private final double avgSessionsPerUser;   // totalSessions / uniqueUsers

        private final long totalClicks;            // item_click_log count
        private final long totalRecoEvents;        // recommendation_event_log count

        private final long errorEvents;            // session_log ERROR count

        private final long startedSessions;        // START count
        private final long endedSessions;          // END count
        private final double sessionEndRate;       // END/START * 100

        private final long recoEmpty;              // RECO_TODAY_EMPTY
        private final long recoGenerated;          // RECO_TODAY_GENERATED
        private final double recoEmptyRate;        // EMPTY/(EMPTY+GENERATED) * 100

        private final double returningRate;        // (START>=2)/(START>=1) * 100 (session_key 기준)

        private final FunnelRow funnel;            // 퍼널 카운트/전환율
    }

    @Getter
    @AllArgsConstructor
    public static class FunnelRow {
        private final long checklistSubmitted;
        private final long recoShown;
        private final long itemSelected;
        private final double checklistToShownRate; // 0~100
        private final double shownToSelectRate;    // 0~100
    }

    @Getter
    @AllArgsConstructor
    public static class DailySessionRow {
        private final LocalDate date;              // KST date
        private final long sessionEventCount;      // session_log row count
        private final long uniqueUserCount;        // distinct session_key (nonblank)
        private final long errorEventCount;        // ERROR count
        private final double errorRate;            // ERROR/session_events * 100
    }

    @Getter
    @AllArgsConstructor
    public static class DailyClickRow {
        private final LocalDate date;              // KST date
        private final long clickCount;
    }

    @Getter
    @AllArgsConstructor
    public static class TopClickedItemRow {
        private final long itemId;
        private final String name;
        private final long clickCount;
    }

    // =========================
    // Public APIs
    // =========================

    public SummaryRow findSummary(OffsetDateTime from, OffsetDateTime to) {
        // 1) 기본 summary + empty rate + end rate
        String sql = """
            SELECT
              /* session_log */
              (SELECT COUNT(*)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS total_session_events,

              (SELECT COUNT(*) FILTER (WHERE event_type = :S_START)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS total_sessions,

              (SELECT COUNT(DISTINCT session_key)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND session_key IS NOT NULL AND session_key <> '') AS unique_users,

              (SELECT COUNT(*) FILTER (WHERE event_type = :S_ERROR)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS error_events,

              (SELECT COUNT(*) FILTER (WHERE event_type = :S_START)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS started_sessions,

              (SELECT COUNT(*) FILTER (WHERE event_type = :S_END)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS ended_sessions,

              /* click */
              (SELECT COUNT(*)
                 FROM public.item_click_log
                WHERE created_at >= :from AND created_at < :to) AS total_clicks,

              /* reco */
              (SELECT COUNT(*)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to) AS total_reco_events,

              (SELECT COUNT(*) FILTER (WHERE event_type = :R_EMPTY)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to) AS reco_empty,

              (SELECT COUNT(*) FILTER (WHERE event_type = :R_GENERATED)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to) AS reco_generated
            """;

        MapSqlParameterSource p = baseParams(from, to)
                .addValue("S_START", S_START)
                .addValue("S_END", S_END)
                .addValue("S_ERROR", S_ERROR)
                .addValue("R_EMPTY", R_EMPTY)
                .addValue("R_GENERATED", R_GENERATED);

        // 2) 퍼널
        FunnelRow funnel = findFunnel(from, to);

        // 3) 리텐션(기간 내 재방문율)
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
                    new FunnelRow(0, 0, 0, 0.0, 0.0)
            );
        }
    }

    public List<DailySessionRow> findDailySessions(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              (created_at AT TIME ZONE 'Asia/Seoul')::date AS d,
              COUNT(*) AS session_event_count,
              COUNT(DISTINCT session_key) FILTER (WHERE session_key IS NOT NULL AND session_key <> '') AS unique_user_count,
              COUNT(*) FILTER (WHERE event_type = :S_ERROR) AS error_event_count
            FROM public.session_log
            WHERE created_at >= :from
              AND created_at <  :to
            GROUP BY d
            ORDER BY d
            """;

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
              (created_at AT TIME ZONE 'Asia/Seoul')::date AS d,
              COUNT(*) AS click_count
            FROM public.item_click_log
            WHERE created_at >= :from
              AND created_at <  :to
            GROUP BY d
            ORDER BY d
            """;

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
              l.clothing_item_id AS item_id,
              COALESCE(i.name, '(unknown)') AS name,
              COUNT(*) AS click_count
            FROM public.item_click_log l
            LEFT JOIN public.clothing_item i ON i.id = l.clothing_item_id
            WHERE l.created_at >= :from
              AND l.created_at <  :to
            GROUP BY l.clothing_item_id, i.name
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

    public FunnelRow findFunnel(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              COALESCE(COUNT(*) FILTER (WHERE event_type = :CHECKLIST), 0) AS checklist_submitted,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :SHOWN), 0)     AS reco_shown,
              COALESCE(COUNT(*) FILTER (WHERE event_type = :SELECTED), 0)  AS item_selected
            FROM public.recommendation_event_log
            WHERE created_at >= :from
              AND created_at <  :to
            """;

        MapSqlParameterSource p = baseParams(from, to)
                .addValue("CHECKLIST", F_CHECKLIST)
                .addValue("SHOWN", F_SHOWN)
                .addValue("SELECTED", F_SELECTED);

        try {
            return jdbc.queryForObject(sql, p, (rs, rowNum) -> {
                long checklist = rs.getLong("checklist_submitted");
                long shown     = rs.getLong("reco_shown");
                long selected  = rs.getLong("item_selected");

                double checklistToShown = rate100(shown, checklist);
                double shownToSelected  = rate100(selected, shown);

                return new FunnelRow(checklist, shown, selected, checklistToShown, shownToSelected);
            });
        } catch (EmptyResultDataAccessException e) {
            return new FunnelRow(0, 0, 0, 0.0, 0.0);
        }
    }

    public double findReturningRate(OffsetDateTime from, OffsetDateTime to) {
        // START 기준: session_key가 기간 내 START 2번 이상이면 returning
        String sql = """
            WITH per_user AS (
              SELECT session_key, COUNT(*) AS starts
              FROM public.session_log
              WHERE created_at >= :from AND created_at < :to
                AND event_type = :S_START
                AND session_key IS NOT NULL AND session_key <> ''
              GROUP BY session_key
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

    // =========================
    // helpers
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