// src/main/java/com/team/backend/service/recommendation/ClothingRecommendationService.java
package com.team.backend.service.recommendation;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.weather.DailyWeatherResponseDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.ComfortZone;
import com.team.backend.domain.enums.SeasonType;
import com.team.backend.repository.analytics.RecommendationMetricsJdbcRepository;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ClothingRecommendationService {

    private final WeatherService weatherService;
    private final ClothingItemRepository clothingItemRepository;
    private final RecommendationMetricsJdbcRepository recommendationEventLogWriter;

    private record ComfortContext(int avgTemp, ComfortZone zone) {}

    private ComfortContext resolveComfortContext(double lat, double lon, String region) {
        DailyWeatherResponseDto today = weatherService.getTodaySmart(lat, lon, region);
        int avgTemp = (int) Math.round(today.getTemperature());
        ComfortZone zone = ComfortZone.from(avgTemp);

        log.info("🌡 [CONTEXT] region={}, lat={}, lon={}, avgTemp={}, zone={}",
                region, lat, lon, avgTemp, zone);

        return new ComfortContext(avgTemp, zone);
    }

    private EnumSet<SeasonType> resolveSeasons(ComfortZone zone) {
        return switch (zone) {
            case VERY_COLD, COLD -> EnumSet.of(SeasonType.WINTER, SeasonType.AUTUMN);
            case MILD -> EnumSet.of(SeasonType.SPRING, SeasonType.AUTUMN);
            case WARM -> EnumSet.of(SeasonType.SPRING, SeasonType.AUTUMN, SeasonType.SUMMER);
            case HOT -> EnumSet.of(SeasonType.SUMMER);
        };
    }

    private boolean matchesSeason(ClothingItem item, Set<SeasonType> todaySeasons) {
        Set<SeasonType> itemSeasons = item.getSeasons();
        if (itemSeasons == null || itemSeasons.isEmpty()) return true; // all season 취급
        for (SeasonType s : itemSeasons) {
            if (todaySeasons.contains(s)) return true;
        }
        return false;
    }

    @Transactional
    public List<ClothingItemResponseDto> recommendToday(String region, double lat, double lon, int limit) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());

        // ✅ DTO 리팩토링 반영: Search 사용
        ClothingItemRequestDto.Search req = ClothingItemRequestDto.Search.builder()
                .temp(ctx.avgTemp())
                .sort("popular")
                .limit(limit)
                .build();

        List<Long> ids = clothingItemRepository.searchCandidateIds(
                req.toCondition(),
                PageRequest.of(0, req.resolvedLimit())
        );

        if (ids.isEmpty()) {
            recommendationEventLogWriter.write(
                    RecommendationEventLogRequestDto.builder()
                            .eventType("RECO_TODAY_EMPTY")
                            .payloadJson("""
                                    {
                                      "region":"%s",
                                      "lat":%f,
                                      "lon":%f,
                                      "limit":%d,
                                      "temp":%d,
                                      "zone":"%s"
                                    }
                                    """.formatted(region, lat, lon, limit, ctx.avgTemp(), ctx.zone()))
                            .build()
            );
            return List.of();
        }

        List<ClothingItem> rows = clothingItemRepository.findAllWithSeasonsByIdIn(ids);
        Map<Long, ClothingItem> map = new HashMap<>();
        for (ClothingItem e : rows) map.put(e.getId(), e);

        List<ClothingItemResponseDto> result = new ArrayList<>();
        for (Long id : ids) {
            ClothingItem item = map.get(id);
            if (item == null) continue;

            if (!ctx.zone().matches(item)) continue;
            if (!matchesSeason(item, todaySeasons)) continue;

            result.add(ClothingItemResponseDto.from(item));
        }

        recommendationEventLogWriter.write(
                RecommendationEventLogRequestDto.builder()
                        .eventType("RECO_TODAY_GENERATED")
                        .payloadJson("""
                                {
                                  "region":"%s",
                                  "lat":%f,
                                  "lon":%f,
                                  "limit":%d,
                                  "temp":%d,
                                  "zone":"%s",
                                  "resultSize":%d
                                }
                                """.formatted(region, lat, lon, limit, ctx.avgTemp(), ctx.zone(), result.size()))
                        .build()
        );

        return result;
    }

    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> recommendTodayByCategory(
            ClothingCategory category,
            String region,
            double lat,
            double lon,
            int limit
    ) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());

        // ✅ DTO 리팩토링 반영: Search 사용
        ClothingItemRequestDto.Search req = ClothingItemRequestDto.Search.builder()
                .category(category)
                .temp(ctx.avgTemp())
                .sort("popular")
                .limit(limit)
                .build();

        List<Long> ids = clothingItemRepository.searchCandidateIds(
                req.toCondition(),
                PageRequest.of(0, req.resolvedLimit())
        );

        if (ids.isEmpty()) return List.of();

        List<ClothingItem> rows = clothingItemRepository.findAllWithSeasonsByIdIn(ids);
        Map<Long, ClothingItem> map = new HashMap<>();
        for (ClothingItem e : rows) map.put(e.getId(), e);

        List<ClothingItemResponseDto> result = new ArrayList<>();
        for (Long id : ids) {
            ClothingItem item = map.get(id);
            if (item == null) continue;

            if (!ctx.zone().matches(item)) continue;
            if (!matchesSeason(item, todaySeasons)) continue;

            result.add(ClothingItemResponseDto.from(item));
        }

        return result;
    }
}