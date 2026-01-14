// src/main/java/com/team/backend/repository/admin/DashboardRetentionJdbcRepository.java
package com.team.backend.repository.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class DashboardRetentionJdbcRepository {

    private static final String KST = "Asia/Seoul";
    private final NamedParameterJdbcTemplate jdbc;

    /**
     * D1 Retention Summary
     * - cohort: [from, toExclusive) 기간 내 "첫 방문일(first_day)"이 잡힌 user_key들
     * - retained: first_day+1에 재방문한 user_key
     *
     * user_key = COALESCE(user_id::text, session_key)
     * (로그 MVP에서 user_id가 대부분 NULL일 수 있으니 session_key fallback 필수)
     *
     * 주의: d+1 체크 때문에 조회범위는 toExclusivePlus1(=toExclusive+1day)까지 필요
     */
    public RetentionRow fetchD1Retention(OffsetDateTime from, OffsetDateTime toExclusivePlus1Day) {
        OffsetDateTime toExclusive = toExclusivePlus1Day.minusDays(1);

        String sql = """
            WITH cohort AS (
              SELECT
                COALESCE(user_id::text, session_key) AS user_key,
                MIN((created_at AT TIME ZONE '%s')::date) AS first_day
              FROM public.session_log
              WHERE created_at >= :from
                AND created_at <  :toExclusive
                AND COALESCE(user_id::text, session_key) IS NOT NULL
                AND COALESCE(user_id::text, session_key) <> ''
              GROUP BY COALESCE(user_id::text, session_key)
            ),
            retained AS (
              SELECT c.user_key
              FROM cohort c
              JOIN public.session_log s
                ON COALESCE(s.user_id::text, s.session_key) = c.user_key
               AND (s.created_at AT TIME ZONE '%s')::date = (c.first_day + 1)
               AND s.created_at >= :from
               AND s.created_at <  :toExclusivePlus1
              GROUP BY c.user_key
            )
            SELECT
              (SELECT COUNT(*) FROM cohort)   AS eligible,
              (SELECT COUNT(*) FROM retained) AS retained
            """.formatted(KST, KST);

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("from", from)
                .addValue("toExclusive", toExclusive)
                .addValue("toExclusivePlus1", toExclusivePlus1Day);

        return jdbc.queryForObject(sql, p, (rs, rowNum) ->
                new RetentionRow(
                        rs.getLong("eligible"),
                        rs.getLong("retained")
                )
        );
    }

    /**
     * D1 Retention Trend (일별 cohort 기준)
     * - date: first_day
     * - baseUsers: 그 날 first_day로 잡힌 user_key 수
     * - retainedUsers: first_day+1에 재방문한 user_key 수
     * - d1RetentionRate: retained/base * 100 (2자리)
     */
    public List<DailyD1TrendRow> fetchD1Trend(OffsetDateTime from, OffsetDateTime toExclusivePlus1Day) {
        OffsetDateTime toExclusive = toExclusivePlus1Day.minusDays(1);

        String sql = """
            WITH first_visit AS (
              SELECT
                COALESCE(user_id::text, session_key) AS user_key,
                MIN((created_at AT TIME ZONE '%s')::date) AS first_day
              FROM public.session_log
              WHERE created_at >= :from
                AND created_at <  :toExclusive
                AND COALESCE(user_id::text, session_key) IS NOT NULL
                AND COALESCE(user_id::text, session_key) <> ''
              GROUP BY COALESCE(user_id::text, session_key)
            ),
            cohort AS (
              SELECT
                first_day AS d,
                COUNT(*) AS base_users
              FROM first_visit
              GROUP BY first_day
            ),
            retained AS (
              SELECT
                fv.first_day AS d,
                COUNT(DISTINCT fv.user_key) AS retained_users
              FROM first_visit fv
              JOIN public.session_log s
                ON COALESCE(s.user_id::text, s.session_key) = fv.user_key
               AND (s.created_at AT TIME ZONE '%s')::date = (fv.first_day + 1)
               AND s.created_at >= :from
               AND s.created_at <  :toExclusivePlus1
              GROUP BY fv.first_day
            )
            SELECT
              c.d AS date,
              c.base_users AS base_users,
              COALESCE(r.retained_users, 0) AS retained_users,
              CASE
                WHEN c.base_users = 0 THEN 0.0
                ELSE ROUND((COALESCE(r.retained_users, 0)::numeric * 100.0) / c.base_users::numeric, 2)
              END AS d1_rate
            FROM cohort c
            LEFT JOIN retained r ON r.d = c.d
            ORDER BY c.d
            """.formatted(KST, KST);

        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("from", from)
                .addValue("toExclusive", toExclusive)
                .addValue("toExclusivePlus1", toExclusivePlus1Day);

        return jdbc.query(sql, p, (rs, rowNum) ->
                new DailyD1TrendRow(
                        rs.getObject("date", LocalDate.class),
                        rs.getLong("base_users"),
                        rs.getLong("retained_users"),
                        rs.getDouble("d1_rate")
                )
        );
    }

    public record RetentionRow(long eligibleUsers, long retainedUsers) {}

    public record DailyD1TrendRow(
            LocalDate date,
            long baseUsers,
            long retainedUsers,
            double d1RetentionRate
    ) {}
}