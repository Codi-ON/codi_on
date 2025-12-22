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
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
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
    private final RecommendationEventLogService recommendationEventLogService;

    // 로그가 추천 흐름을 죽이면 안 됨 → 시스템 기본값
    private static final UUID SYSTEM_SESSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String SYSTEM_SESSION_KEY = "SYSTEM";

    private record ComfortContext(int avgTemp, ComfortZone zone) {
    }

    private ComfortContext resolveComfortContext(double lat, double lon, String region) {
        DailyWeatherResponseDto today = weatherService.getTodaySmart(lat, lon, region);
        int avgTemp = (int) Math.round(today.getTemperature());
        ComfortZone zone = ComfortZone.from(avgTemp);
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
        if (itemSeasons == null || itemSeasons.isEmpty()) return true;
        for (SeasonType s : itemSeasons) if (todaySeasons.contains(s)) return true;
        return false;
    }

    private void safeLog(RecommendationEventType type, String payloadJson) {
        try {
            Map<String, Object> payloadMap = null;

            if (payloadJson != null && !payloadJson.isBlank()) {
                com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
                payloadMap = om.readValue(
                        payloadJson,
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                        }
                );
            }

            recommendationEventLogService.write(
                    RecommendationEventLogRequestDto.builder()
                            .eventType(type)                 // enum
                            .sessionId(SYSTEM_SESSION_ID)     // NOT NULL 방어
                            .sessionKey(SYSTEM_SESSION_KEY)   // 있으면 더 좋음
                            .payload(payloadMap)              // ✅ DTO가 Map payload면 여기로 넣어야 DB에 들어감
                            .build()
            );
        } catch (org.springframework.dao.DataAccessException
                 | IllegalArgumentException
                 | com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("[RECO_LOG_FAIL] type={} reason={}", type, e.getMessage());
        }
    }

    public List<ClothingItemResponseDto> recommendToday(String region, double lat, double lon, int limit) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());

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
            safeLog(
                    RecommendationEventType.RECO_GENERATED, // 너 enum에 맞춰 쓰면 됨 (EMPTY 따로 없으면 GENERATED만)
                    """
                            {"region":"%s","lat":%f,"lon":%f,"limit":%d,"temp":%d,"zone":"%s","resultSize":0}
                            """.formatted(region, lat, lon, limit, ctx.avgTemp(), ctx.zone())
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

        safeLog(
                RecommendationEventType.RECO_GENERATED,
                """
                        {"region":"%s","lat":%f,"lon":%f,"limit":%d,"temp":%d,"zone":"%s","resultSize":%d}
                        """.formatted(region, lat, lon, limit, ctx.avgTemp(), ctx.zone(), result.size())
        );

        return result;
    }

    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> recommendTodayByCategory(
            ClothingCategory category, String region, double lat, double lon, int limit
    ) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());

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