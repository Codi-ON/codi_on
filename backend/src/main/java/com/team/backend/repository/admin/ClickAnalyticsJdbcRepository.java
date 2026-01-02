package com.team.backend.repository.admin;

import com.team.backend.repository.click.DailyClicksRow;
import com.team.backend.repository.click.TopClickedItemRow;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Repository
public class ClickAnalyticsJdbcRepository {

  private final JdbcTemplate jdbcTemplate;

  public ClickAnalyticsJdbcRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<DailyClicksRow> findDailyClickTrend(LocalDate from, LocalDate to) {
    String sql = """
        SELECT created_at::date AS date, COUNT(*) AS clicks
        FROM item_click_log
        WHERE created_at::date BETWEEN ? AND ?
        GROUP BY created_at::date
        ORDER BY created_at::date
        """;

    return jdbcTemplate.query(
        sql,
        (rs, rowNum) -> new DailyClicksRowImpl(
            rs.getDate("date").toLocalDate(),
            rs.getLong("clicks")
        ),
        Date.valueOf(from),
        Date.valueOf(to)
    );
  }

  public List<TopClickedItemRow> findTopClickedItems(LocalDate from, LocalDate to, int topN) {
    String sql = """
        SELECT clothing_item_id AS clothingItemId, COUNT(*) AS clicks
        FROM item_click_log
        WHERE clothing_item_id IS NOT NULL
          AND created_at::date BETWEEN ? AND ?
        GROUP BY clothing_item_id
        ORDER BY clicks DESC
        LIMIT ?
        """;

    return jdbcTemplate.query(
        sql,
        (rs, rowNum) -> new TopClickedItemRowImpl(
            rs.getLong("clothingItemId"),
            rs.getLong("clicks")
        ),
        Date.valueOf(from),
        Date.valueOf(to),
        topN
    );
  }

  private record DailyClicksRowImpl(LocalDate date, long clicks) implements DailyClicksRow {
    @Override public LocalDate getDate() { return date; }
    @Override public long getClicks() { return clicks; }
  }

  private record TopClickedItemRowImpl(long clothingItemId, long clicks) implements TopClickedItemRow {
    @Override public long getClothingItemId() { return clothingItemId; }
    @Override public long getClicks() { return clicks; }
  }
}