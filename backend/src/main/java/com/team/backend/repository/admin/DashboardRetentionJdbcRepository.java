// src/main/java/com/team/backend/repository/admin/DashboardRetentionJdbcRepository.java
package com.team.backend.repository.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

@Repository
@RequiredArgsConstructor
public class DashboardRetentionJdbcRepository {

    private static final String KST = "Asia/Seoul";
    private final NamedParameterJdbcTemplate jdbc;

    public RetentionRow fetchD1Retention(OffsetDateTime from, OffsetDateTime toExclusivePlus1Day) {
        // cohort: [from, toExclusive) 기간 중 첫 방문일(first_day)을 잡고,
        // retained: first_day + 1에 재방문했는지 체크 (조회 범위는 toExclusive+1day까지 필요)
        String sql = """
            WITH cohort AS (
              SELECT
                user_id,
                MIN((created_at AT TIME ZONE '%s')::date) AS first_day
              FROM public.session_log
              WHERE user_id IS NOT NULL
                AND created_at >= :from
                AND created_at <  :toExclusive
              GROUP BY user_id
            ),
            retained AS (
              SELECT c.user_id
              FROM cohort c
              JOIN public.session_log s
                ON s.user_id = c.user_id
               AND (s.created_at AT TIME ZONE '%s')::date = (c.first_day + 1)
               AND s.created_at >= :from
               AND s.created_at <  :toExclusivePlus1
              GROUP BY c.user_id
            )
            SELECT
              (SELECT COUNT(*) FROM cohort)  AS eligible,
              (SELECT COUNT(*) FROM retained) AS retained
            """.formatted(KST, KST);

        // toExclusive = (toExclusivePlus1Day - 1day)
        OffsetDateTime toExclusive = toExclusivePlus1Day.minusDays(1);

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

    public record RetentionRow(long eligibleUsers, long retainedUsers) {}
}