package com.team.backend.service;

import com.team.backend.api.dto.weather.DailyWeatherDto;
import com.team.backend.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ClothingRecommendationService {

    private final WeatherService weatherService;
    private final ClothingItemService clothingItemService;

    // ===== 내부 컨텍스트 =====
    private record ComfortContext(int avgTemp, ComfortZone zone) {}

    private ComfortContext resolveComfortContext(double lat, double lon, String region) {
        DailyWeatherDto today = weatherService.getTodaySmart(lat, lon, region);

        double avgTempDouble = today.getTemperature();
        int avgTemp = (int) Math.round(avgTempDouble);
        ComfortZone zone = ComfortZone.from(avgTemp);

        log.info("🌡 [CONTEXT] region={}, lat={}, lon={}, avgTemp={}, zone={}",
                region, lat, lon, avgTemp, zone);

        return new ComfortContext(avgTemp, zone);
    }

    // ===== ComfortZone → 오늘 계절 후보 매핑 =====
    private EnumSet<SeasonType> resolveSeasons(ComfortZone zone) {
        return switch (zone) {
            case VERY_COLD, COLD -> EnumSet.of(SeasonType.WINTER, SeasonType.AUTUMN);
            case MILD -> EnumSet.of(SeasonType.SPRING, SeasonType.AUTUMN);
            case WARM -> EnumSet.of(SeasonType.SPRING, SeasonType.AUTUMN, SeasonType.SUMMER);
            case HOT -> EnumSet.of(SeasonType.SUMMER);
        };
    }

    /**
     * 👗 옷이 오늘 계절 후보에 맞는지 체크
     *  - 옷에 seasons 가 비어있으면(또는 null) → “모든 계절용”으로 취급해서 통과
     *  - 하나라도 겹치는 Season 이 있으면 true
     */
    private boolean matchesSeason(ClothingItem item, Set<SeasonType> todaySeasons) {
        Set<SeasonType> itemSeasons = item.getSeasons();
        if (itemSeasons == null || itemSeasons.isEmpty()) {
            return true; // 계절 미지정 → 아무 계절이나 입을 수 있는 걸로
        }
        for (SeasonType season : itemSeasons) {
            if (todaySeasons.contains(season)) {
                return true;
            }
        }
        return false;
    }

    // ===== 실제 추천 메서드들 =====

    /**
     * ✅ 오늘 날씨 기준 전체 추천
     */
    public List<ClothingItem> recommendToday(String region, double lat, double lon) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());

        // 1차: 온도 범위 기준 후보 (suitableMin/Max)
        List<ClothingItem> candidates =
                clothingItemService.recommendByTemperature(ctx.avgTemp());

        // 2차: ComfortZone 룰 + 계절 필터
        return candidates.stream()
                .filter(ctx.zone()::matches)                // 두께 + OUTER 룰
                .filter(item -> matchesSeason(item, todaySeasons)) // 계절 매칭
                .sorted((a, b) -> b.getSelectedCount() - a.getSelectedCount())
                .toList();
    }

    /**
     * ✅ 오늘 날씨 + 카테고리 기준 추천
     */
    public List<ClothingItem> recommendTodayByCategory(
            ClothingCategory category,
            String region,
            double lat,
            double lon,
            int limit
    ) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());

        // 1차: 카테고리 + 온도 조건
        List<ClothingItem> candidates =
                clothingItemService.recommendByCategoryAndTemperature(category, ctx.avgTemp());

        // 2차: ComfortZone 룰 + 계절 필터 + 인기순 + limit
        return candidates.stream()
                .filter(ctx.zone()::matches)
                .filter(item -> matchesSeason(item, todaySeasons))
                .sorted((a, b) -> b.getSelectedCount() - a.getSelectedCount())
                .limit(limit)
                .toList();
    }
}