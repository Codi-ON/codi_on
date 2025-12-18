package com.team.backend.repository.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class DashboardOverviewJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    // =========================
    // 1) 저장된 총 데이터량 카드
    // =========================
    public OverviewCountsRow fetchCounts(OffsetDateTime from, OffsetDateTime to) {
        // NOTE: 테이블명은 프로젝트 실제 테이블로 맞춰.
        // - clothing_item, session_log, item_click_log, recommendation_event_log 는 너 ERD 기준으로 존재.
        String sql = """
            SELECT
              (SELECT COUNT(*) FROM public.clothing_item)                         AS clothing_item_count,
              (SELECT COUNT(*) FROM public.session_log WHERE created_at >= :from AND created_at < :to) AS session_log_count,
              (SELECT COUNT(*) FROM public.item_click_log WHERE created_at >= :from AND created_at < :to) AS item_click_count,
              (SELECT COUNT(*) FROM public.recommendation_event_log WHERE created_at >= :from AND created_at < :to) AS reco_event_count
            """;

        return jdbc.queryForObject(
                sql,
                Map.of("from", from, "to", to),
                (rs, rowNum) -> new OverviewCountsRow(
                        rs.getLong("clothing_item_count"),
                        rs.getLong("session_log_count"),
                        rs.getLong("item_click_count"),
                        rs.getLong("reco_event_count")
                )
        );
    }

    // =========================
    // 2) 최근 사용자 추이(일별)
    // =========================
    public List<DailyActiveUsersRow> fetchDailyActiveUsers(OffsetDateTime from, OffsetDateTime to) {
        String sql = """
            SELECT
              (created_at AT TIME ZONE 'Asia/Seoul')::date AS log_date,
              COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS dau
            FROM public.session_log
            WHERE created_at >= :from
              AND created_at <  :to
            GROUP BY log_date
            ORDER BY log_date
            """;

        return jdbc.query(
                sql,
                Map.of("from", from, "to", to),
                (rs, rowNum) -> new DailyActiveUsersRow(
                        rs.getObject("log_date", java.time.LocalDate.class),
                        rs.getLong("dau")
                )
        );
    }

    // =========================
    // 3) 추천 → 클릭 퍼널(비율용)
    // =========================
    public FunnelRow fetchRecoToClickFunnel(OffsetDateTime from, OffsetDateTime to) {
        // NOTE: event_type 값은 너 로그 정책에 맞춰 통일해야 함.
        // - 예: RECO_TODAY_GENERATED, RECO_TODAY_EMPTY 등
        String sql = """
            SELECT
              (SELECT COUNT(*) FROM public.recommendation_event_log
                 WHERE created_at >= :from AND created_at < :to
                   AND event_type = 'RECO_TODAY_GENERATED'
              ) AS reco_generated,
              (SELECT COUNT(*) FROM public.item_click_log
                 WHERE created_at >= :from AND created_at < :to
              ) AS item_clicks
            """;

        return jdbc.queryForObject(
                sql,
                Map.of("from", from, "to", to),
                (rs, rowNum) -> new FunnelRow(
                        rs.getLong("reco_generated"),
                        rs.getLong("item_clicks")
                )
        );
    }

    // =========================
    // 4) 카테고리 분포(가장 많은 옷?)
    // =========================
    public List<CategoryCountRow> fetchClothingCategoryCounts(int topN) {
        String sql = """
            SELECT category, COUNT(*) AS cnt
            FROM public.clothing_item
            GROUP BY category
            ORDER BY cnt DESC
            LIMIT :topN
            """;

        return jdbc.query(
                sql,
                Map.of("topN", topN),
                (rs, rowNum) -> new CategoryCountRow(
                        rs.getString("category"),
                        rs.getLong("cnt")
                )
        );
    }

    // ===== rows =====
    public record OverviewCountsRow(
            long clothingItemCount,
            long sessionLogCount,
            long itemClickCount,
            long recoEventCount
    ) {}

    public record DailyActiveUsersRow(
            java.time.LocalDate date,
            long dau
    ) {}

    public record FunnelRow(
            long recoGenerated,
            long itemClicks
    ) {}

    public record CategoryCountRow(
            String category,
            long count
    ) {}
}