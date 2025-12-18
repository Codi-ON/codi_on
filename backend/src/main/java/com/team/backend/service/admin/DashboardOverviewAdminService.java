// src/main/java/com/team/backend/service/admin/DashboardOverviewAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.api.dto.session.SessionMetricsDashboardResponseDto;
import com.team.backend.repository.analytics.ClickAnalyticsJdbcRepository;
import com.team.backend.repository.analytics.DashboardOverviewJdbcRepository;
import com.team.backend.repository.analytics.SessionLogMetricsJdbcRepository;
import com.team.backend.repository.click.DailyClicksRow;
import com.team.backend.repository.click.TopClickedItemRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardOverviewAdminService {

    private final DashboardOverviewJdbcRepository dashboardOverviewJdbcRepository;
    private final SessionLogMetricsJdbcRepository sessionLogMetricsJdbcRepository;
    private final ClickAnalyticsJdbcRepository clickAnalyticsJdbcRepository;

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final String TIMEZONE_LABEL = "Asia/Seoul";

    public DashboardOverviewResponseDto getOverview(LocalDate from, LocalDate to, int topN) {

        // 기간 정책: [from 00:00 KST, (to+1) 00:00 KST)
        OffsetDateTime fromTs = from.atStartOfDay(KST).toOffsetDateTime();
        OffsetDateTime toTs = to.plusDays(1).atStartOfDay(KST).toOffsetDateTime();

        // ===== DB 조회 =====
        var counts = dashboardOverviewJdbcRepository.fetchCounts(fromTs, toTs);
        var dauRows = dashboardOverviewJdbcRepository.fetchDailyActiveUsers(fromTs, toTs);
        var funnel = dashboardOverviewJdbcRepository.fetchRecoToClickFunnel(fromTs, toTs);
        var categoryRows = dashboardOverviewJdbcRepository.fetchClothingCategoryCounts(topN);

        SessionMetricsDashboardResponseDto.Summary sessionSummary =
                sessionLogMetricsJdbcRepository.findSummary(fromTs, toTs);
        List<SessionMetricsDashboardResponseDto.DailyTrendItem> sessionDaily =
                sessionLogMetricsJdbcRepository.findDailyTrend(fromTs, toTs);
        List<SessionMetricsDashboardResponseDto.HourlyUsageItem> sessionHourly =
                sessionLogMetricsJdbcRepository.findHourlyUsage(fromTs, toTs);

        List<DailyClicksRow> clickDaily =
                clickAnalyticsJdbcRepository.findDailyClickTrend(from, to); // inclusive
        List<TopClickedItemRow> topClicks =
                clickAnalyticsJdbcRepository.findTopClickedItems(from, to, topN);

        // ===== meta/range =====
        DashboardOverviewResponseDto.Meta meta =
                new DashboardOverviewResponseDto.Meta(OffsetDateTime.now(), TIMEZONE_LABEL);
        DashboardOverviewResponseDto.Range range =
                new DashboardOverviewResponseDto.Range(fromTs, toTs);

        // ===== sections 조립 =====
        Map<String, DashboardOverviewResponseDto.Section> sections = new LinkedHashMap<>();
        sections.put("overview", buildOverviewSection(counts));
        sections.put("sessions", buildSessionsSection(sessionSummary, sessionDaily, sessionHourly, dauRows));
        sections.put("clicks", buildClicksSection(counts, clickDaily, topClicks, topN));
        sections.put("recommendation", buildRecommendationSection(funnel));
        sections.put("closet", buildClosetSection(categoryRows, topN));

        return new DashboardOverviewResponseDto(meta, range, sections);
    }

    // -------------------------
    // Section Builders
    // -------------------------

    private DashboardOverviewResponseDto.Section buildOverviewSection(Object countsRow) {
        long clothingItemCount = invokeLong(countsRow, "clothingItemCount");
        long sessionLogCount = invokeLong(countsRow, "sessionLogCount");
        long itemClickCount = invokeLong(countsRow, "itemClickCount");
        long recoEventCount = invokeLong(countsRow, "recoEventCount");

        List<DashboardOverviewResponseDto.Card> cards = List.of(
                card("clothingItemCount", "등록된 옷 아이템 수", clothingItemCount, "개"),
                card("sessionLogCount", "세션 로그 수", sessionLogCount, "건"),
                card("itemClickCount", "아이템 클릭 수", itemClickCount, "건"),
                card("recoEventCount", "추천 이벤트 수", recoEventCount, "건")
        );

        return new DashboardOverviewResponseDto.Section("Overview", cards, List.of(), List.of());
    }

    private DashboardOverviewResponseDto.Section buildSessionsSection(
            SessionMetricsDashboardResponseDto.Summary summary,
            List<SessionMetricsDashboardResponseDto.DailyTrendItem> daily,
            List<SessionMetricsDashboardResponseDto.HourlyUsageItem> hourly,
            List<?> dauRows
    ) {
        List<DashboardOverviewResponseDto.Card> cards = List.of(
                card("totalSessions", "총 세션", summary.getTotalSessions(), "건"),
                card("uniqueUsers", "고유 사용자", summary.getUniqueUsers(), "명"),
                card("avgSessionsPerUser", "유저당 평균 세션", toNumber(summary.getAvgSessionsPerUser()), "회")
        );

        DashboardOverviewResponseDto.Chart dailySessionsChart = chart(
                "dailySessions",
                "일별 세션 추이",
                "date",
                "count",
                List.of(series("sessions",
                        daily.stream().map(it -> point(it.getDate().toString(), it.getSessionCount())).toList()
                ))
        );

        DashboardOverviewResponseDto.Chart dailyUniqueUsersChart = chart(
                "dailyUniqueUsers",
                "일별 고유 사용자(세션 기반)",
                "date",
                "users",
                List.of(series("uniqueUsers",
                        daily.stream().map(it -> point(it.getDate().toString(), it.getUniqueUserCount())).toList()
                ))
        );

        DashboardOverviewResponseDto.Chart hourlyUsageChart = chart(
                "hourlyUsage",
                "시간대별 세션",
                "hour",
                "count",
                List.of(series("sessions",
                        hourly.stream().map(it -> point(String.valueOf(it.getHour()), it.getSessionCount())).toList()
                ))
        );

        List<DashboardOverviewResponseDto.Point> dauPoints = dauRows.stream()
                .map(r -> point(
                        String.valueOf(invokeObj(r, "logDate")),
                        invokeLong(r, "dau")
                ))
                .toList();

        DashboardOverviewResponseDto.Chart dauChart = chart(
                "dailyActiveUsers",
                "일별 활성 사용자(DAU)",
                "date",
                "users",
                List.of(series("dau", dauPoints))
        );

        return new DashboardOverviewResponseDto.Section(
                "Sessions",
                cards,
                List.of(dailySessionsChart, dailyUniqueUsersChart, hourlyUsageChart, dauChart),
                List.of()
        );
    }

    private DashboardOverviewResponseDto.Section buildClicksSection(
            Object countsRow,
            List<DailyClicksRow> daily,
            List<TopClickedItemRow> topItems,
            int topN
    ) {
        long itemClickCount = invokeLong(countsRow, "itemClickCount");

        List<DashboardOverviewResponseDto.Card> cards = List.of(
                card("totalClicks", "총 클릭", itemClickCount, "건")
        );

        DashboardOverviewResponseDto.Chart dailyClicksChart = chart(
                "dailyClicks",
                "일별 클릭 추이",
                "date",
                "count",
                List.of(series("clicks",
                        daily.stream().map(r -> point(r.getDate().toString(), r.getClicks())).toList()
                ))
        );

        List<Map<String, Object>> rows = topItems.stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("clothingItemId", r.getClothingItemId());
                    m.put("clicks", r.getClicks());
                    return m;
                })
                .toList();

        DashboardOverviewResponseDto.Table topTable = table(
                "topClickedItems",
                "TOP 클릭 아이템 (Top " + topN + ")",
                List.of("clothingItemId", "clicks"),
                rows
        );

        return new DashboardOverviewResponseDto.Section(
                "Clicks",
                cards,
                List.of(dailyClicksChart),
                List.of(topTable)
        );
    }

    private DashboardOverviewResponseDto.Section buildRecommendationSection(Object funnelRow) {
        long recoGenerated = invokeLong(funnelRow, "recoGenerated");
        long itemClicks = invokeLong(funnelRow, "itemClicks");

        double conversionPct = (recoGenerated <= 0) ? 0.0 : ((double) itemClicks / (double) recoGenerated) * 100.0;

        List<DashboardOverviewResponseDto.Card> cards = List.of(
                card("recoGenerated", "추천 생성 수", recoGenerated, "건"),
                card("itemClicks", "클릭 수", itemClicks, "건"),
                card("recoToClickConversion", "추천→클릭 전환율", round(conversionPct), "%")
        );

        return new DashboardOverviewResponseDto.Section("Recommendation", cards, List.of(), List.of());
    }

    private DashboardOverviewResponseDto.Section buildClosetSection(List<?> categoryRows, int topN) {
        List<Map<String, Object>> rows = categoryRows.stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("category", invokeObj(r, "category"));
                    m.put("count", invokeLong(r, "count"));
                    return m;
                })
                .toList();

        DashboardOverviewResponseDto.Table table = table(
                "categoryDistribution",
                "카테고리 분포 (Top " + topN + ")",
                List.of("category", "count"),
                rows
        );

        return new DashboardOverviewResponseDto.Section("Closet", List.of(), List.of(), List.of(table));
    }

    // -------------------------
    // DTO constructors
    // -------------------------

    private DashboardOverviewResponseDto.Card card(String key, String label, Number value, String unit) {
        return new DashboardOverviewResponseDto.Card(key, label, value, unit);
    }

    private DashboardOverviewResponseDto.Chart chart(String key, String title, String xUnit, String yUnit,
                                                     List<DashboardOverviewResponseDto.Series> series) {
        return new DashboardOverviewResponseDto.Chart(key, title, xUnit, yUnit, series);
    }

    private DashboardOverviewResponseDto.Series series(String name, List<DashboardOverviewResponseDto.Point> points) {
        return new DashboardOverviewResponseDto.Series(name, points);
    }

    private DashboardOverviewResponseDto.Point point(String x, Number y) {
        return new DashboardOverviewResponseDto.Point(x, y);
    }

    private DashboardOverviewResponseDto.Table table(String key, String title, List<String> columns, List<Map<String, Object>> rows) {
        return new DashboardOverviewResponseDto.Table(key, title, columns, rows);
    }

    private Number toNumber(BigDecimal v) {
        return (v == null) ? 0 : v;
    }

    private double round(double v) {
        double p = Math.pow(10, 2);
        return Math.round(v * p) / p;
    }

    // -------------------------
    // Reflection getters (Row 타입이 인터페이스/record 혼재라서 대응)
    // -------------------------

    private long invokeLong(Object target, String method) {
        try {
            Object v = target.getClass().getMethod(method).invoke(target);
            if (v instanceof Number n) return n.longValue();
            return 0L;
        } catch (Exception e) {
            throw new IllegalStateException("Missing method: " + target.getClass().getSimpleName() + "." + method + "()", e);
        }
    }

    private Object invokeObj(Object target, String method) {
        try {
            return target.getClass().getMethod(method).invoke(target);
        } catch (Exception e) {
            throw new IllegalStateException("Missing method: " + target.getClass().getSimpleName() + "." + method + "()", e);
        }
    }
}