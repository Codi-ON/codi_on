// src/main/java/com/team/backend/service/ClothingRecommendationService.java
package com.team.backend.service;

import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.api.dto.clothingItem.ClothingItemSearchRequestDto;
import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.weather.DailyWeatherResponseDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.ComfortZone;
import com.team.backend.domain.enums.SeasonType;
import com.team.backend.repository.ClothingItemRepository;
import com.team.backend.repository.log.RecommendationEventLogJdbcRepository;
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
    private final RecommendationEventLogJdbcRepository recommendationEventLogWriter;

    /**
     * 오늘 체감 온도 컨텍스트
     */
    private record ComfortContext(int avgTemp, ComfortZone zone) {
    }

    private ComfortContext resolveComfortContext(double lat, double lon, String region) {
        DailyWeatherResponseDto today = weatherService.getTodaySmart(lat, lon, region);
        int avgTemp = (int) Math.round(today.getTemperature());
        ComfortZone zone = ComfortZone.from(avgTemp);

        log.info("🌡 [CONTEXT] region={}, lat={}, lon={}, avgTemp={}, zone={}",
                region, lat, lon, avgTemp, zone);

        return new ComfortContext(avgTemp, zone);
    }

    /**
     * ComfortZone → 오늘 계절 후보
     */
    private EnumSet<SeasonType> resolveSeasons(ComfortZone zone) {
        return switch (zone) {
            case VERY_COLD, COLD -> EnumSet.of(SeasonType.WINTER, SeasonType.AUTUMN);
            case MILD -> EnumSet.of(SeasonType.SPRING, SeasonType.AUTUMN);
            case WARM -> EnumSet.of(SeasonType.SPRING, SeasonType.AUTUMN, SeasonType.SUMMER);
            case HOT -> EnumSet.of(SeasonType.SUMMER);
        };
    }

    /**
     * 오늘 계절 후보와 아이템 시즌 매칭 여부
     */
    private boolean matchesSeason(ClothingItem item, Set<SeasonType> todaySeasons) {
        Set<SeasonType> itemSeasons = item.getSeasons();
        if (itemSeasons == null || itemSeasons.isEmpty()) {
            // 시즌 미지정 = all season 취급
            return true;
        }
        for (SeasonType s : itemSeasons) {
            if (todaySeasons.contains(s)) return true;
        }
        return false;
    }

    /**
     * 오늘 추천 (카테고리 전체)
     *  - 추천 결과/컨텍스트를 recommendation_event_log 에 남김
     */
    @Transactional
    public List<ClothingItemResponseDto> recommendToday(String region, double lat, double lon, int limit) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());

        ClothingItemSearchRequestDto req = ClothingItemSearchRequestDto.builder()
                .temp(ctx.avgTemp())
                .sort("popular")
                .limit(limit)
                .build();

        List<Long> ids = clothingItemRepository.searchCandidateIds(
                req,
                PageRequest.of(0, req.resolvedLimit())
        );

        // 후보 자체가 0개인 경우도 로그로 남겨서 분석 가능하게
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
        for (ClothingItem e : rows) {
            map.put(e.getId(), e);
        }

        List<ClothingItemResponseDto> result = new ArrayList<>();
        for (Long id : ids) {
            ClothingItem item = map.get(id);
            if (item == null) continue;

            if (!ctx.zone().matches(item)) continue;
            if (!matchesSeason(item, todaySeasons)) continue;

            result.add(ClothingItemResponseDto.from(item));
        }

        // 추천 결과까지 포함해서 한 번에 로그 남기기
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

    /**
     * 오늘 추천 (카테고리 필터 버전)
     */
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

        ClothingItemSearchRequestDto req = ClothingItemSearchRequestDto.builder()
                .category(category)
                .temp(ctx.avgTemp())
                .sort("popular")
                .limit(limit)
                .build();

        List<Long> ids = clothingItemRepository.searchCandidateIds(
                req,
                PageRequest.of(0, req.resolvedLimit())
        );
        if (ids.isEmpty()) {
            return List.of();
        }

        List<ClothingItem> rows = clothingItemRepository.findAllWithSeasonsByIdIn(ids);

        Map<Long, ClothingItem> map = new HashMap<>();
        for (ClothingItem e : rows) {
            map.put(e.getId(), e);
        }

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