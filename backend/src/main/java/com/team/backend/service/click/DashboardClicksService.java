package com.team.backend.service.click;

import com.team.backend.api.dto.click.DashboardClicksResponse;
import com.team.backend.repository.admin.ClickAnalyticsJdbcRepository;
import com.team.backend.repository.click.DailyClicksRow;
import com.team.backend.repository.click.TopClickedItemRow;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class DashboardClicksService {

  private static final String FIXED_REGION = "Seoul"; // ✅ 입력값 제거, 응답에만 고정

  private final ClickAnalyticsJdbcRepository repo;

  public DashboardClicksService(ClickAnalyticsJdbcRepository repo) {
    this.repo = repo;
  }

  public DashboardClicksResponse getDashboardClicks(LocalDate from, LocalDate to, int topN) {
    List<DailyClicksRow> trendRows = repo.findDailyClickTrend(from, to);
    List<TopClickedItemRow> topRows = repo.findTopClickedItems(from, to, topN);

    long totalClicks = trendRows.stream().mapToLong(DailyClicksRow::getClicks).sum();

    var points = trendRows.stream()
        .map(r -> new DashboardClicksResponse.DailyClickTrend.DailyPoint(r.getDate(), r.getClicks()))
        .toList();

    var items = topRows.stream()
        .map(r -> new DashboardClicksResponse.TopClickedItems.TopClickedItem(
            r.getClothingItemId(),
            r.getClicks(),
            totalClicks == 0 ? 0.0 : (double) r.getClicks() / (double) totalClicks
        ))
        .toList();

    return new DashboardClicksResponse(
        new DashboardClicksResponse.Meta(FIXED_REGION, from, to, Instant.now(), false),
        new DashboardClicksResponse.DailyClickTrend(points, totalClicks),
        new DashboardClicksResponse.TopClickedItems(topN, items)
    );
  }
}