package com.team.backend.api.dto.click;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record DashboardClicksResponse(
    Meta meta,
    DailyClickTrend dailyClickTrend,
    TopClickedItems topClickedItems
) {
  public record Meta(
      String region,
      LocalDate from,
      LocalDate to,
      Instant generatedAt,
      boolean cached
  ) {}

  public record DailyClickTrend(
      List<DailyPoint> points,
      long totalClicks
  ) {
    public record DailyPoint(LocalDate date, long clicks) {}
  }

  public record TopClickedItems(
      int topN,
      List<TopClickedItem> items
  ) {
    public record TopClickedItem(
        long clothingItemId,
        long clicks,
        double share
    ) {}
  }
}