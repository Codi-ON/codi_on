// src/main/java/com/team/backend/repository/admin/DashboardMonthlyJdbcRepository.java
package com.team.backend.repository.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardMonthlyRowResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
@Repository
@RequiredArgsConstructor
public class DashboardMonthlyJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    /**
     * recommendation_event_log event_type (프로젝트 내 혼재 대응)
     * - "추천 노출/생성" 계열을 하나로 묶어서 reco_generated / reco_shown 용도로 사용
     * - empty 계열도 함께 묶음
     */
    private static final List<String> RECO_GENERATED_LIST =
            List.of("RECO_GENERATED", "RECO_TODAY_GENERATED", "RECO_SHOWN");
    private static final List<String> RECO_EMPTY_LIST =
            List.of("RECO_EMPTY", "RECO_TODAY_EMPTY", "RECO_TODAY_EMPTY"); // 중복 있어도 무해

    // Funnel event types (recommendation_event_log 기준)
    private static final String EV_CHECKLIST = "CHECKLIST_SUBMITTED";
    private static final String EV_ITEM_SEL  = "RECO_ITEM_SELECTED";
    /**
     * NOTE:
     * - 컬럼명은 feedback_requested로 유지하되,
     *   현재 로그 이벤트는 "피드백 제출"로 쌓이니 RECO_FEEDBACK_SUBMITTED로 집계.
     */
    private static final String EV_FEEDBACK_SUBMITTED = "RECO_FEEDBACK_SUBMITTED";

    public void upsertMonthlyKpi(LocalDate monthStart, String region, OffsetDateTime from, OffsetDateTime to) {
        /**
         * 핵심:
         * - admin_monthly_kpi는 "스냅샷 테이블"이라 이 upsert가 실행되어야 값이 채워짐.
         * - recommendation_event_log / session_log 가 자동으로 "묶여서" 들어가는 구조가 아님.
         */
        String sql = """
            WITH
            sess AS (
              SELECT
                COUNT(*) AS total_session_events,
                COUNT(*) FILTER (WHERE event_type = 'START') AS total_sessions,
                COUNT(DISTINCT COALESCE(user_id::text, session_key))
                  FILTER (WHERE COALESCE(user_id::text, session_key) IS NOT NULL
                           AND COALESCE(user_id::text, session_key) <> '') AS unique_users,
                COUNT(*) FILTER (WHERE event_type = 'ERROR') AS error_events,
                COUNT(*) FILTER (WHERE event_type = 'START') AS started_sessions,
                COUNT(*) FILTER (WHERE event_type = 'END')   AS ended_sessions
              FROM public.session_log
              WHERE created_at >= :from AND created_at < :to
            ),
            reco AS (
              SELECT
                COUNT(*) AS total_reco_events,

                COUNT(*) FILTER (WHERE event_type IN (:RECO_EMPTY_LIST))     AS reco_empty,
                COUNT(*) FILTER (WHERE event_type IN (:RECO_GENERATED_LIST)) AS reco_generated,

                COUNT(*) FILTER (WHERE event_type = :EV_CHECKLIST)           AS checklist_submitted,
                COUNT(*) FILTER (WHERE event_type IN (:RECO_GENERATED_LIST)) AS reco_shown,
                COUNT(*) FILTER (WHERE event_type = :EV_FEEDBACK_SUBMITTED)  AS feedback_requested,
                COUNT(*) FILTER (WHERE event_type = :EV_ITEM_SEL)            AS item_selected
              FROM public.recommendation_event_log
              WHERE created_at >= :from AND created_at < :to
            ),
            clicks AS (
              SELECT COUNT(*) AS total_clicks
              FROM public.item_click_log
              WHERE created_at >= :from AND created_at < :to
            )
            INSERT INTO public.admin_monthly_kpi (
              month_start, region, generated_at,

              total_session_events, total_sessions, unique_users, avg_sessions_per_user,
              total_clicks, total_reco_events,
              error_events,
              started_sessions, ended_sessions, session_end_rate,
              reco_empty, reco_generated, reco_empty_rate,

              checklist_submitted, reco_shown, feedback_requested, item_selected,
              checklist_to_shown_rate, shown_to_feedback_rate, checklist_to_feedback_rate, shown_to_select_rate
            )
            SELECT
              :monthStart::date,
              :region::text,
              now(),

              sess.total_session_events,
              sess.total_sessions,
              sess.unique_users,
              CASE WHEN sess.unique_users = 0 THEN 0
                   ELSE ROUND((sess.total_sessions::numeric / sess.unique_users::numeric), 2)
              END,

              clicks.total_clicks,
              reco.total_reco_events,

              sess.error_events,
              sess.started_sessions,
              sess.ended_sessions,
              CASE WHEN sess.started_sessions = 0 THEN 0
                   ELSE ROUND((sess.ended_sessions::numeric * 100 / sess.started_sessions::numeric), 2)
              END,

              reco.reco_empty,
              reco.reco_generated,
              CASE WHEN (reco.reco_empty + reco.reco_generated) = 0 THEN 0
                   ELSE ROUND((reco.reco_empty::numeric * 100 / (reco.reco_empty + reco.reco_generated)::numeric), 2)
              END,

              reco.checklist_submitted,
              reco.reco_shown,
              reco.feedback_requested,
              reco.item_selected,

              CASE WHEN reco.checklist_submitted = 0 THEN 0
                   ELSE ROUND((reco.reco_shown::numeric * 100 / reco.checklist_submitted::numeric), 2)
              END,
              CASE WHEN reco.reco_shown = 0 THEN 0
                   ELSE ROUND((reco.feedback_requested::numeric * 100 / reco.reco_shown::numeric), 2)
              END,
              CASE WHEN reco.checklist_submitted = 0 THEN 0
                   ELSE ROUND((reco.feedback_requested::numeric * 100 / reco.checklist_submitted::numeric), 2)
              END,
              CASE WHEN reco.reco_shown = 0 THEN 0
                   ELSE ROUND((reco.item_selected::numeric * 100 / reco.reco_shown::numeric), 2)
              END
            FROM sess, reco, clicks
            ON CONFLICT (month_start, region)
            DO UPDATE SET
              generated_at = EXCLUDED.generated_at,

              total_session_events = EXCLUDED.total_session_events,
              total_sessions       = EXCLUDED.total_sessions,
              unique_users         = EXCLUDED.unique_users,
              avg_sessions_per_user= EXCLUDED.avg_sessions_per_user,

              total_clicks         = EXCLUDED.total_clicks,
              total_reco_events    = EXCLUDED.total_reco_events,

              error_events         = EXCLUDED.error_events,
              started_sessions     = EXCLUDED.started_sessions,
              ended_sessions       = EXCLUDED.ended_sessions,
              session_end_rate     = EXCLUDED.session_end_rate,

              reco_empty           = EXCLUDED.reco_empty,
              reco_generated       = EXCLUDED.reco_generated,
              reco_empty_rate      = EXCLUDED.reco_empty_rate,

              checklist_submitted        = EXCLUDED.checklist_submitted,
              reco_shown                 = EXCLUDED.reco_shown,
              feedback_requested         = EXCLUDED.feedback_requested,
              item_selected              = EXCLUDED.item_selected,
              checklist_to_shown_rate    = EXCLUDED.checklist_to_shown_rate,
              shown_to_feedback_rate     = EXCLUDED.shown_to_feedback_rate,
              checklist_to_feedback_rate = EXCLUDED.checklist_to_feedback_rate,
              shown_to_select_rate       = EXCLUDED.shown_to_select_rate
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("monthStart", monthStart)
                .addValue("region", region)
                .addValue("from", from)
                .addValue("to", to)
                .addValue("RECO_EMPTY_LIST", RECO_EMPTY_LIST)
                .addValue("RECO_GENERATED_LIST", RECO_GENERATED_LIST)
                .addValue("EV_CHECKLIST", EV_CHECKLIST)
                .addValue("EV_FEEDBACK_SUBMITTED", EV_FEEDBACK_SUBMITTED)
                .addValue("EV_ITEM_SEL", EV_ITEM_SEL);

        jdbc.update(sql, p);
    }

    /**
     * TopClicked 스냅샷 (네가 준 버전 유지)
     * - item_click_log: clothing_id
     * - clothing_item: clothing_id 매핑
     * - snapshot에는 clothing_item_id(PK) 저장
     */
    public void refreshMonthlyTopClicked(LocalDate monthStart, String region,
                                         OffsetDateTime from, OffsetDateTime to, int topN) {
        jdbc.update(
                "DELETE FROM public.admin_monthly_top_clicked_item WHERE month_start = :m AND region = :r",
                new MapSqlParameterSource().addValue("m", monthStart).addValue("r", region)
        );

        if (topN <= 0) return;

        String sql = """
            WITH ranked AS (
              SELECT
                i.id AS clothing_item_id,
                COUNT(*) AS click_count
              FROM public.item_click_log l
              JOIN public.clothing_item i
                ON i.clothing_id = l.clothing_id
              WHERE l.created_at >= :from
                AND l.created_at <  :to
                AND l.clothing_id IS NOT NULL
              GROUP BY i.id
              ORDER BY click_count DESC
              LIMIT :topN
            )
            INSERT INTO public.admin_monthly_top_clicked_item (
              month_start, region, clothing_item_id, click_count, rank_no, created_at
            )
            SELECT
              :monthStart::date,
              :region::text,
              r.clothing_item_id,
              r.click_count,
              ROW_NUMBER() OVER (ORDER BY r.click_count DESC)::int AS rank_no,
              now()
            FROM ranked r
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("monthStart", monthStart)
                .addValue("region", region)
                .addValue("from", from)
                .addValue("to", to)
                .addValue("topN", topN);

        jdbc.update(sql, p);
    }

    public List<DashboardMonthlyRowResponseDto> fetchMonthlyRows(LocalDate fromMonthStart, LocalDate toMonthStart, String region) {
    String sql = """
            SELECT
              to_char(month_start, 'YYYY-MM') AS month,
              total_session_events, total_sessions, unique_users, avg_sessions_per_user,
              total_clicks, total_reco_events,
              error_events,
              started_sessions, ended_sessions, session_end_rate,
              reco_empty, reco_generated, reco_empty_rate,

              checklist_submitted, reco_shown, feedback_requested, item_selected,
              checklist_to_shown_rate, shown_to_feedback_rate, checklist_to_feedback_rate, shown_to_select_rate
            FROM public.admin_monthly_kpi
            WHERE region = :r
              AND month_start >= :fromM
              AND month_start <= :toM
            ORDER BY month_start
            """;

    return jdbc.query(sql, Map.of("r", region, "fromM", fromMonthStart, "toM", toMonthStart), (rs, rowNum) -> {
        double avg = rs.getBigDecimal("avg_sessions_per_user") == null ? 0.0 : rs.getBigDecimal("avg_sessions_per_user").doubleValue();
        double endRate = rs.getBigDecimal("session_end_rate") == null ? 0.0 : rs.getBigDecimal("session_end_rate").doubleValue();
        double emptyRate = rs.getBigDecimal("reco_empty_rate") == null ? 0.0 : rs.getBigDecimal("reco_empty_rate").doubleValue();

        double checklistToShown = rs.getBigDecimal("checklist_to_shown_rate") == null ? 0.0 : rs.getBigDecimal("checklist_to_shown_rate").doubleValue();
        double shownToFeedback  = rs.getBigDecimal("shown_to_feedback_rate") == null ? 0.0 : rs.getBigDecimal("shown_to_feedback_rate").doubleValue();
        double checklistToFeedback = rs.getBigDecimal("checklist_to_feedback_rate") == null ? 0.0 : rs.getBigDecimal("checklist_to_feedback_rate").doubleValue();
        double shownToSelect = rs.getBigDecimal("shown_to_select_rate") == null ? 0.0 : rs.getBigDecimal("shown_to_select_rate").doubleValue();

        DashboardMonthlyRowResponseDto.Funnel funnel = new DashboardMonthlyRowResponseDto.Funnel(
                rs.getLong("checklist_submitted"),
                rs.getLong("reco_shown"),
                rs.getLong("feedback_requested"),
                rs.getLong("item_selected"),
                checklistToShown,
                shownToFeedback,
                checklistToFeedback,
                shownToSelect
        );

        return new DashboardMonthlyRowResponseDto(
                rs.getString("month"),

                rs.getLong("total_session_events"),
                rs.getLong("total_sessions"),
                rs.getLong("unique_users"),
                avg,

                rs.getLong("total_clicks"),
                rs.getLong("total_reco_events"),

                rs.getLong("error_events"),

                rs.getLong("started_sessions"),
                rs.getLong("ended_sessions"),
                endRate,

                rs.getLong("reco_empty"),
                rs.getLong("reco_generated"),
                emptyRate,

                funnel,

                List.<DashboardMonthlyRowResponseDto.TopClickedItem>of()
        );
    });
}
    public List<TopClickedSnapshotRow> fetchMonthlyTopClicked(LocalDate fromMonthStart, LocalDate toMonthStart, String region, int topN) {
        if (topN <= 0) return List.of();

        String sql = """
            WITH totals AS (
              SELECT
                month_start,
                region,
                COALESCE(SUM(click_count), 0)::numeric AS total_clicks
              FROM public.admin_monthly_top_clicked_item
              WHERE region = :r
                AND month_start >= :fromM
                AND month_start <= :toM
              GROUP BY month_start, region
            )
            SELECT
              to_char(t.month_start, 'YYYY-MM') AS month,
              t.rank_no AS rank,
              t.clothing_item_id AS item_id,
              COALESCE(i.name, '(unknown)') AS name,
              t.click_count,
              CASE WHEN tot.total_clicks = 0 THEN 0
                   ELSE (t.click_count::numeric / tot.total_clicks)
              END AS click_ratio
            FROM public.admin_monthly_top_clicked_item t
            JOIN totals tot
              ON tot.month_start = t.month_start
             AND tot.region = t.region
            LEFT JOIN public.clothing_item i
              ON i.id = t.clothing_item_id
            WHERE t.region = :r
              AND t.month_start >= :fromM
              AND t.month_start <= :toM
              AND t.rank_no <= :topN
            ORDER BY t.month_start, t.rank_no
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("r", region)
                .addValue("fromM", fromMonthStart)
                .addValue("toM", toMonthStart)
                .addValue("topN", topN);

        return jdbc.query(sql, p, (rs, rowNum) -> {
            BigDecimal ratio = rs.getBigDecimal("click_ratio");
            return new TopClickedSnapshotRow(
                    rs.getString("month"),
                    rs.getInt("rank"),
                    rs.getLong("item_id"),
                    rs.getString("name"),
                    rs.getLong("click_count"),
                    ratio == null ? 0.0 : ratio.doubleValue()
            );
        });
    }

    public OffsetDateTime getLatestGeneratedAt(LocalDate fromMonthStart, LocalDate toMonthStart, String region) {
        String sql = """
            SELECT MAX(generated_at) AS generated_at
            FROM public.admin_monthly_kpi
            WHERE region = :r
              AND month_start >= :fromM
              AND month_start <= :toM
            """;

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("r", region)
                .addValue("fromM", fromMonthStart)
                .addValue("toM", toMonthStart);

        return jdbc.query(sql, p, rs -> {
            if (!rs.next()) return null;
            return rs.getObject("generated_at", OffsetDateTime.class);
        });
    }

    public record TopClickedSnapshotRow(
            String month,
            int rank,
            long itemId,
            String name,
            long clickCount,
            double clickRatio
    ) {}
}