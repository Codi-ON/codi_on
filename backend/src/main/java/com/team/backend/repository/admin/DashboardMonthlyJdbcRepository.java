// src/main/java/com/team/backend/repository/admin/DashboardMonthlyJdbcRepository.java
package com.team.backend.repository.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardMonthlyRowResponseDto;
import lombok.RequiredArgsConstructor;
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

    // =========================
    // 1) 월별 KPI upsert
    // =========================
    public void upsertMonthlyKpi(LocalDate monthStart, String region, OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            INSERT INTO public.admin_monthly_kpi (
              month_start, region, generated_at,
              total_session_events, total_sessions, unique_users, avg_sessions_per_user,
              total_clicks, total_reco_events,
              error_events,
              started_sessions, ended_sessions, session_end_rate,
              reco_empty, reco_generated, reco_empty_rate
            )
            SELECT
              :monthStart::date AS month_start,
              :region::text     AS region,
              now()             AS generated_at,

              (SELECT COUNT(*)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to) AS total_session_events,

              (SELECT COUNT(DISTINCT session_id)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND session_id IS NOT NULL) AS total_sessions,

              (SELECT COUNT(DISTINCT user_id)
                 FROM public.session_log
                WHERE user_id IS NOT NULL
                  AND created_at >= :from AND created_at < :to) AS unique_users,

              CASE
                WHEN (SELECT COUNT(DISTINCT user_id)
                        FROM public.session_log
                       WHERE user_id IS NOT NULL
                         AND created_at >= :from AND created_at < :to) = 0
                THEN 0
                ELSE ROUND(
                  (
                    (SELECT COUNT(DISTINCT session_id)
                       FROM public.session_log
                      WHERE created_at >= :from AND created_at < :to
                        AND session_id IS NOT NULL)::numeric
                    /
                    (SELECT COUNT(DISTINCT user_id)
                       FROM public.session_log
                      WHERE user_id IS NOT NULL
                        AND created_at >= :from AND created_at < :to)::numeric
                  ),
                  2
                )
              END AS avg_sessions_per_user,

              (SELECT COUNT(*)
                 FROM public.item_click_log
                WHERE created_at >= :from AND created_at < :to) AS total_clicks,

              (SELECT COUNT(*)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to) AS total_reco_events,

              (SELECT COUNT(*)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'ERROR') AS error_events,

              (SELECT COUNT(DISTINCT session_id)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'START') AS started_sessions,

              (SELECT COUNT(DISTINCT session_id)
                 FROM public.session_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'END') AS ended_sessions,

              CASE
                WHEN (SELECT COUNT(DISTINCT session_id)
                        FROM public.session_log
                       WHERE created_at >= :from AND created_at < :to
                         AND event_type = 'START') = 0
                THEN 0
                ELSE ROUND(
                  (
                    (SELECT COUNT(DISTINCT session_id)
                       FROM public.session_log
                      WHERE created_at >= :from AND created_at < :to
                        AND event_type = 'END')::numeric
                    * 100
                    /
                    (SELECT COUNT(DISTINCT session_id)
                       FROM public.session_log
                      WHERE created_at >= :from AND created_at < :to
                        AND event_type = 'START')::numeric
                  ),
                  2
                )
              END AS session_end_rate,

              (SELECT COUNT(*)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'RECO_TODAY_EMPTY') AS reco_empty,

              (SELECT COUNT(*)
                 FROM public.recommendation_event_log
                WHERE created_at >= :from AND created_at < :to
                  AND event_type = 'RECO_TODAY_GENERATED') AS reco_generated,

              CASE
                WHEN (
                  (SELECT COUNT(*) FROM public.recommendation_event_log
                    WHERE created_at >= :from AND created_at < :to AND event_type = 'RECO_TODAY_EMPTY')
                  +
                  (SELECT COUNT(*) FROM public.recommendation_event_log
                    WHERE created_at >= :from AND created_at < :to AND event_type = 'RECO_TODAY_GENERATED')
                ) = 0
                THEN 0
                ELSE ROUND(
                  (
                    (SELECT COUNT(*) FROM public.recommendation_event_log
                      WHERE created_at >= :from AND created_at < :to AND event_type = 'RECO_TODAY_EMPTY')::numeric
                    * 100
                    /
                    (
                      (SELECT COUNT(*) FROM public.recommendation_event_log
                        WHERE created_at >= :from AND created_at < :to AND event_type = 'RECO_TODAY_EMPTY')
                      +
                      (SELECT COUNT(*) FROM public.recommendation_event_log
                        WHERE created_at >= :from AND created_at < :to AND event_type = 'RECO_TODAY_GENERATED')
                    )::numeric
                  ),
                  2
                )
              END AS reco_empty_rate
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
              reco_empty_rate      = EXCLUDED.reco_empty_rate
            """;

        jdbc.update(sql, Map.of(
                "monthStart", monthStart,
                "region", region,
                "from", from,
                "to", to
        ));
    }

    // =========================
    // 2) 월별 TopClicked 스냅샷 갱신 (delete + insert)
    // =========================
    public void refreshMonthlyTopClicked(LocalDate monthStart, String region, OffsetDateTime from, OffsetDateTime to, int topN) {
        jdbc.update(
                "DELETE FROM public.admin_monthly_top_clicked_item WHERE month_start = :m AND region = :r",
                Map.of("m", monthStart, "r", region)
        );

        String sql = """
            WITH total AS (
              SELECT COUNT(*)::numeric AS total_clicks
              FROM public.item_click_log
              WHERE created_at >= :from AND created_at < :to
            ),
            ranked AS (
              SELECT
                l.clothing_item_id AS item_id,
                COALESCE(i.name, '(unknown)') AS name,
                COUNT(*) AS click_count
              FROM public.item_click_log l
              LEFT JOIN public.clothing_item i ON i.id = l.clothing_item_id
              WHERE l.created_at >= :from AND l.created_at < :to
              GROUP BY l.clothing_item_id, i.name
              ORDER BY click_count DESC
              LIMIT :topN
            )
            INSERT INTO public.admin_monthly_top_clicked_item (
              month_start, region, rank, clothing_item_id, name, click_count, click_ratio, generated_at
            )
            SELECT
              :monthStart::date,
              :region::text,
              ROW_NUMBER() OVER (ORDER BY r.click_count DESC)::int AS rank,
              r.item_id,
              r.name,
              r.click_count,
              CASE WHEN t.total_clicks = 0 THEN 0
                   ELSE (r.click_count::numeric / t.total_clicks)
              END AS click_ratio,
              now()
            FROM ranked r
            CROSS JOIN total t
            """;

        jdbc.update(sql, Map.of(
                "monthStart", monthStart,
                "region", region,
                "from", from,
                "to", to,
                "topN", topN
        ));
    }

    // =========================
    // 3) rows 조회 (KPI)
    // =========================
    public List<DashboardMonthlyRowResponseDto> fetchMonthlyRows(LocalDate fromMonthStart, LocalDate toMonthStart, String region) {
        String sql = """
            SELECT
              to_char(month_start, 'YYYY-MM') AS month,
              total_session_events, total_sessions, unique_users, avg_sessions_per_user,
              total_clicks, total_reco_events,
              error_events,
              started_sessions, ended_sessions, session_end_rate,
              reco_empty, reco_generated, reco_empty_rate
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

                    List.of() // service에서 month별 topClicked 붙일거라 여기선 빈 리스트
            );
        });
    }

    // =========================
    // 4) TopClicked 조회 (range)
    // =========================
    public List<TopClickedSnapshotRow> fetchMonthlyTopClicked(LocalDate fromMonthStart, LocalDate toMonthStart, String region, int topN) {
        String sql = """
            SELECT
              to_char(month_start, 'YYYY-MM') AS month,
              rank,
              clothing_item_id,
              name,
              click_count,
              click_ratio
            FROM public.admin_monthly_top_clicked_item
            WHERE region = :r
              AND month_start >= :fromM
              AND month_start <= :toM
            ORDER BY month_start, rank
            """;

        return jdbc.query(sql, Map.of("r", region, "fromM", fromMonthStart, "toM", toMonthStart), (rs, rowNum) -> {
            BigDecimal ratio = rs.getBigDecimal("click_ratio");
            return new TopClickedSnapshotRow(
                    rs.getString("month"),
                    rs.getInt("rank"),
                    rs.getLong("clothing_item_id"),
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
        return jdbc.query(sql, Map.of("r", region, "fromM", fromMonthStart, "toM", toMonthStart), rs -> {
            if (!rs.next()) return null;
            return rs.getObject("generated_at", OffsetDateTime.class);
        });
    }

    public record TopClickedSnapshotRow(
            String month,
            int rank,
            long clothingItemId,
            String name,
            long clickCount,
            double clickRatio
    ) {}
}