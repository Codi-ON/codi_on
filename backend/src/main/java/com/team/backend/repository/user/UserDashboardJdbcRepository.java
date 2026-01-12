// src/main/java/com/team/backend/repository/user/UserDashboardDetailsJdbcRepository.java
package com.team.backend.repository.user;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class UserDashboardJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    // 공통: TopN 고정
    private static final int TOP_N = 10;

    /**
     * Top clicked items (ALL_CLICKS)
     * 반환 컬럼:
     * - clothing_id, name, category, image_url, cnt, ratio, total_clicks
     */
    public List<Map<String, Object>> queryTopClickedItems(
            String sessionKey,
            OffsetDateTime rangeStartKst,
            OffsetDateTime rangeEndKstExclusive
    ) {
        String sql = """
            WITH base AS (
              SELECT l.clothing_id
              FROM public.item_click_log l
              WHERE l.session_key = :sessionKey
                AND l.event_type = 'ITEM_CLICK'
                AND l.created_at >= :rangeStartKst
                AND l.created_at <  :rangeEndKst
            ),
            tot AS (
              SELECT COUNT(*)::numeric AS total_clicks FROM base
            ),
            ranked AS (
              SELECT b.clothing_id, COUNT(*)::numeric AS cnt
              FROM base b
              GROUP BY b.clothing_id
              ORDER BY cnt DESC, b.clothing_id ASC
              LIMIT :topN
            )
            SELECT
              r.clothing_id AS clothing_id,
              ci.name       AS name,
              ci.category   AS category,
              ci.image_url  AS image_url,
              r.cnt         AS cnt,
              ROUND(r.cnt / NULLIF(t.total_clicks,0), 4) AS ratio,
              t.total_clicks AS total_clicks
            FROM ranked r
            JOIN public.clothing_item ci ON ci.clothing_id = r.clothing_id
            CROSS JOIN tot t
            ORDER BY r.cnt DESC, r.clothing_id ASC
            """;

        return jdbc.queryForList(sql, Map.of(
                "sessionKey", sessionKey,
                "rangeStartKst", rangeStartKst,
                "rangeEndKst", rangeEndKstExclusive,
                "topN", TOP_N
        ));
    }

    /**
     * Top favorited clicked items (FAVORITED_CLICKS)
     * "현재 찜된 아이템 중 클릭"
     * 반환 컬럼:
     * - clothing_id, name, category, image_url, cnt, ratio, total_clicks
     */
    public List<Map<String, Object>> queryTopFavoritedClickedItems(
            String sessionKey,
            OffsetDateTime rangeStartKst,
            OffsetDateTime rangeEndKstExclusive
    ) {
        String sql = """
            WITH base AS (
              SELECT l.clothing_id
              FROM public.item_click_log l
              JOIN public.favorite_item f
                ON f.session_key = l.session_key
               AND f.clothing_id = l.clothing_id
              WHERE l.session_key = :sessionKey
                AND l.event_type = 'ITEM_CLICK'
                AND l.created_at >= :rangeStartKst
                AND l.created_at <  :rangeEndKst
            ),
            tot AS (
              SELECT COUNT(*)::numeric AS total_clicks FROM base
            ),
            ranked AS (
              SELECT b.clothing_id, COUNT(*)::numeric AS cnt
              FROM base b
              GROUP BY b.clothing_id
              ORDER BY cnt DESC, b.clothing_id ASC
              LIMIT :topN
            )
            SELECT
              r.clothing_id AS clothing_id,
              ci.name       AS name,
              ci.category   AS category,
              ci.image_url  AS image_url,
              r.cnt         AS cnt,
              ROUND(r.cnt / NULLIF(t.total_clicks,0), 4) AS ratio,
              t.total_clicks AS total_clicks
            FROM ranked r
            JOIN public.clothing_item ci ON ci.clothing_id = r.clothing_id
            CROSS JOIN tot t
            ORDER BY r.cnt DESC, r.clothing_id ASC
            """;

        return jdbc.queryForList(sql, Map.of(
                "sessionKey", sessionKey,
                "rangeStartKst", rangeStartKst,
                "rangeEndKst", rangeEndKstExclusive,
                "topN", TOP_N
        ));
    }

    /**
     * Category donut (ALL_CLICKS)
     * 반환 컬럼:
     * - category, cnt, ratio, total_clicks
     */
    public List<Map<String, Object>> queryCategoryDonutAllClicks(
            String sessionKey,
            OffsetDateTime rangeStartKst,
            OffsetDateTime rangeEndKstExclusive
    ) {
        String sql = """
            WITH base AS (
              SELECT ci.category
              FROM public.item_click_log l
              JOIN public.clothing_item ci ON ci.clothing_id = l.clothing_id
              WHERE l.session_key = :sessionKey
                AND l.event_type = 'ITEM_CLICK'
                AND l.created_at >= :rangeStartKst
                AND l.created_at <  :rangeEndKst
            ),
            tot AS (
              SELECT COUNT(*)::numeric AS total_clicks FROM base
            )
            SELECT
              b.category AS category,
              COUNT(*)::numeric AS cnt,
              ROUND(COUNT(*)::numeric / NULLIF(t.total_clicks,0), 4) AS ratio,
              t.total_clicks AS total_clicks
            FROM base b
            CROSS JOIN tot t
            GROUP BY b.category, t.total_clicks
            ORDER BY cnt DESC, category ASC
            """;

        return jdbc.queryForList(sql, Map.of(
                "sessionKey", sessionKey,
                "rangeStartKst", rangeStartKst,
                "rangeEndKst", rangeEndKstExclusive
        ));
    }

    /**
     * Outfits daily (outfit_history 기반)
     * 반환 컬럼:
     * - d, saved, feedback, avg_temp, avg_feels_like, most_common_condition, most_used_reco_strategy
     */
    public List<Map<String, Object>> queryOutfitsDaily(
            String sessionKey,
            LocalDate fromInclusive,
            LocalDate toInclusive
    ) {
        LocalDate endExclusive = toInclusive.plusDays(1);

        String sql = """
            SELECT
              oh.outfit_date AS d,
              COUNT(*)::bigint AS saved,
              COUNT(*) FILTER (WHERE oh.feedback_rating IS NOT NULL)::bigint AS feedback,
              ROUND(AVG(oh.weather_temp)::numeric, 1) AS avg_temp,
              ROUND(AVG(oh.weather_feels_like)::numeric, 1) AS avg_feels_like,
              mode() WITHIN GROUP (ORDER BY oh.weather_condition) AS most_common_condition,
              mode() WITHIN GROUP (ORDER BY oh.reco_strategy) AS most_used_reco_strategy
            FROM public.outfit_history oh
            WHERE oh.session_key = :sessionKey
              AND oh.outfit_date >= :fromDate
              AND oh.outfit_date <  :endExclusive
            GROUP BY oh.outfit_date
            ORDER BY oh.outfit_date ASC
            """;

        return jdbc.queryForList(sql, Map.of(
                "sessionKey", sessionKey,
                "fromDate", fromInclusive,
                "endExclusive", endExclusive
        ));
    }
}