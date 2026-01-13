// src/main/java/com/team/backend/service/user/UserDashboardService.java
package com.team.backend.service.user;

import com.team.backend.api.dto.user.UserDashboardRequest;
import com.team.backend.api.dto.user.UserDashboardResponse;
import com.team.backend.repository.user.UserDashboardJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserDashboardService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final UserDashboardJdbcRepository userDashboardJdbcRepository;

    public UserDashboardResponse getOverview(String sessionKey, UserDashboardRequest req) {
        YearMonth ym = resolveYearMonth(req.getYear(), req.getMonth());
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        OffsetDateTime rangeStartKst = from.atStartOfDay(KST).toOffsetDateTime();
        OffsetDateTime rangeEndKstExclusive = ym.plusMonths(1).atDay(1).atStartOfDay(KST).toOffsetDateTime();

        // 1) outfit_history 기반: saved/feedback + 날씨/전략 집계(일별 rows)
        List<Map<String, Object>> outfitDailyRows = userDashboardJdbcRepository.queryOutfitsDaily(sessionKey, from, to);

        long monthlyOutfitCount = 0L;
        long feedbackCount = 0L;

        // avgTemp/avgFeelsLike 계산
        double tempSum = 0.0;
        long tempN = 0L;

        double feelsSum = 0.0;
        long feelsN = 0L;

        // mostCommonCondition / mostUsedRecoStrategy 계산
        Map<String, Long> conditionFreq = new HashMap<>();
        Map<String, Long> strategyFreq = new HashMap<>();

        for (Map<String, Object> r : outfitDailyRows) {
            long saved = toLong(r.get("saved"));
            long feedback = toLong(r.get("feedback"));

            monthlyOutfitCount += saved;
            feedbackCount += feedback;

            Double avgTempDay = toDoubleNullable(r.get("avg_temp"));
            if (avgTempDay != null) {
                tempSum += avgTempDay * Math.max(saved, 1);
                tempN += Math.max(saved, 1);
            }

            Double avgFeelsDay = toDoubleNullable(r.get("avg_feels_like"));
            if (avgFeelsDay != null) {
                feelsSum += avgFeelsDay * Math.max(saved, 1);
                feelsN += Math.max(saved, 1);
            }

            String cond = (String) r.get("most_common_condition");
            if (cond != null && !cond.isBlank()) conditionFreq.merge(cond, 1L, Long::sum);

            String strat = (String) r.get("most_used_reco_strategy");
            if (strat != null && !strat.isBlank()) strategyFreq.merge(strat, 1L, Long::sum);
        }

        long feedbackRate = 0L;
        if (monthlyOutfitCount > 0) {
            feedbackRate = BigDecimal.valueOf(feedbackCount)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(monthlyOutfitCount), 0, RoundingMode.HALF_UP)
                    .longValue();
        }

        Double avgTemp = (tempN == 0) ? null : round1(tempSum / tempN);
        Double avgFeelsLike = (feelsN == 0) ? null : round1(feelsSum / feelsN);

        String mostCommonCondition = pickMode(conditionFreq);
        String mostUsedRecoStrategy = pickMode(strategyFreq);

        // 2) category donut (ALL_CLICKS)
        List<Map<String, Object>> donutRows =
                userDashboardJdbcRepository.queryCategoryDonutAllClicks(sessionKey, rangeStartKst, rangeEndKstExclusive);

        long totalClicks = donutRows.isEmpty() ? 0L : toLong(donutRows.get(0).get("total_clicks"));

        List<UserDashboardResponse.CategoryDonutItem> donutItems = new ArrayList<>();
        for (Map<String, Object> r : donutRows) {
            donutItems.add(UserDashboardResponse.CategoryDonutItem.builder()
                    .category((String) r.get("category"))
                    .count(toLong(r.get("cnt")))
                    .ratio(toBigDecimal4(r.get("ratio")))
                    .build());
        }

        // 3) top items (TOP 10 고정은 repo SQL에 LIMIT 10으로 이미 들어가 있음)
        List<UserDashboardResponse.TopItem> topClickedItems =
                mapTopItems(userDashboardJdbcRepository.queryTopClickedItems(sessionKey, rangeStartKst, rangeEndKstExclusive));

        List<UserDashboardResponse.TopItem> topFavoritedClickedItems =
                mapTopItems(userDashboardJdbcRepository.queryTopFavoritedClickedItems(sessionKey, rangeStartKst, rangeEndKstExclusive));

        // 4) response assemble
        return UserDashboardResponse.builder()
                .range(UserDashboardResponse.Range.builder()
                        .from(from.toString())
                        .to(to.toString())
                        .build())
                .summary(UserDashboardResponse.Summary.builder()
                        .monthlyOutfitCount(monthlyOutfitCount)
                        .feedbackCount(feedbackCount)
                        .feedbackRate(feedbackRate)
                        .mostUsedRecoStrategy(mostUsedRecoStrategy)
                        .mostCommonCondition(mostCommonCondition)
                        .avgTemp(avgTemp)
                        .avgFeelsLike(avgFeelsLike)
                        .build())
                .funnel(UserDashboardResponse.Funnel.builder()
                        .saved(monthlyOutfitCount)
                        .feedback(feedbackCount)
                        .build())
                .categoryDonut(UserDashboardResponse.CategoryDonut.builder()
                        .basis("ALL_CLICKS")
                        .totalClicks(totalClicks)
                        .items(donutItems)
                        .build())
                .topClickedItems(topClickedItems)
                .topFavoritedClickedItems(topFavoritedClickedItems)
                .build();
    }

    // ====== helpers ======

    private YearMonth resolveYearMonth(Integer year, Integer month) {
        if (year != null && month != null) {
            if (month < 1 || month > 12) throw new IllegalArgumentException("month must be 1~12");
            return YearMonth.of(year, month);
        }
        LocalDate now = LocalDate.now(KST);
        return YearMonth.of(now.getYear(), now.getMonthValue());
    }

    private List<UserDashboardResponse.TopItem> mapTopItems(List<Map<String, Object>> rows) {
        List<UserDashboardResponse.TopItem> items = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            items.add(UserDashboardResponse.TopItem.builder()
                    .clothingId(toLong(r.get("clothing_id")))
                    .name((String) r.get("name"))
                    .category((String) r.get("category"))
                    .count(toLong(r.get("cnt")))
                    .imageUrl((String) r.get("image_url"))
                    .build());
        }
        return items;
    }

    private String pickMode(Map<String, Long> freq) {
        if (freq.isEmpty()) return null;
        return freq.entrySet().stream()
                .sorted((a, b) -> {
                    int c = Long.compare(b.getValue(), a.getValue()); // desc
                    if (c != 0) return c;
                    return String.valueOf(a.getKey()).compareTo(String.valueOf(b.getKey())); // tie-break
                })
                .findFirst()
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private long toLong(Object v) {
        if (v == null) return 0L;
        return ((Number) v).longValue();
    }

    private Double toDoubleNullable(Object v) {
        if (v == null) return null;
        if (v instanceof BigDecimal bd) return bd.doubleValue();
        return ((Number) v).doubleValue();
    }

    private BigDecimal toBigDecimal4(Object v) {
        if (v == null) return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        if (v instanceof BigDecimal bd) return bd.setScale(4, RoundingMode.HALF_UP);
        return new BigDecimal(String.valueOf(v)).setScale(4, RoundingMode.HALF_UP);
    }

    private Double round1(double v) {
        return BigDecimal.valueOf(v).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}