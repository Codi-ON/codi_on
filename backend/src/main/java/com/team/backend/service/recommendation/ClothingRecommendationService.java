// src/main/java/com/team/backend/service/recommendation/ClothingRecommendationService.java
package com.team.backend.service.recommendation;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.weather.DailyWeatherResponseDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.service.ai.ComfortAiClient;
import com.team.backend.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ClothingRecommendationService {

    private final WeatherService weatherService;
    private final ClothingItemRepository clothingItemRepository;
    private final RecommendationEventLogService recommendationEventLogService;
    private final ComfortAiClient comfortAiClient;

    // 로그가 추천 흐름을 죽이면 안 됨 → 시스템 기본값
    private static final UUID SYSTEM_SESSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String SYSTEM_SESSION_KEY = "SYSTEM";

    // ✅ 요구사항: 카테고리별 Top3 고정
    private static final int TOP_N = 3;

    // ✅ /today 응답에 포함할 카테고리 (원하는 것만)
    private static final List<ClothingCategory> TODAY_CATEGORIES =
            List.of(ClothingCategory.TOP, ClothingCategory.BOTTOM, ClothingCategory.OUTER, ClothingCategory.ONE_PIECE);

    // ==============================
    // Public APIs
    // ==============================

    /**
     * GET /api/recommend/today
     * - 날씨 1회 조회
     * - 카테고리별 후보 N개(=limit) 확보
     * - ML batch score로 정렬 후 카테고리별 Top3를 합쳐 반환
     */
    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> recommendToday(String region, double lat, double lon, int limit) {
        DailyWeatherResponseDto w = weatherService.getTodaySmart(lat, lon, region);

        List<ClothingItemResponseDto> out = new ArrayList<>();
        for (ClothingCategory category : TODAY_CATEGORIES) {
            out.addAll(recommendTodayByCategoryInternal(category, region, lat, lon, limit, w));
        }

        safeLog(
                RecommendationEventType.RECO_GENERATED,
                """
                {"scope":"today-all-ml-batch","region":"%s","lat":%f,"lon":%f,"candidateLimit":%d,"resultSize":%d}
                """.formatted(region, lat, lon, limit, out.size())
        );

        return out;
    }

    /**
     * GET /api/recommend/today/by-category
     * - 날씨 1회 조회
     * - 해당 카테고리 후보 N개(=limit) 확보
     * - ML batch score로 정렬 후 Top3 반환
     */
    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> recommendTodayByCategory(
            ClothingCategory category, String region, double lat, double lon, int limit
    ) {
        DailyWeatherResponseDto w = weatherService.getTodaySmart(lat, lon, region);
        return recommendTodayByCategoryInternal(category, region, lat, lon, limit, w);
    }

    // ==============================
    // Core internal
    // ==============================

    private List<ClothingItemResponseDto> recommendTodayByCategoryInternal(
            ClothingCategory category,
            String region,
            double lat,
            double lon,
            int candidateLimit,
            DailyWeatherResponseDto w
    ) {
        int resolvedLimit = Math.max(candidateLimit, TOP_N);

        // 1) 후보 id 확보 (DB단에서는 넓게: category + popular 정렬)
        List<Long> ids = fetchCandidateIds(category, resolvedLimit);
        if (ids.isEmpty()) {
            safeLog(
                    RecommendationEventType.RECO_GENERATED,
                    """
                    {"scope":"today-by-category-ml-batch","category":"%s","region":"%s","lat":%f,"lon":%f,"candidateLimit":%d,"resultSize":0}
                    """.formatted(category, region, lat, lon, resolvedLimit)
            );
            return List.of();
        }

        // 2) ids 순서 보존해서 엔티티 로딩
        List<ClothingItem> items = fetchOrderedEntities(ids);
        if (items.isEmpty()) return List.of();

        // 3) ML batch scoring (1회 호출)
        Map<Long, Double> scoreMap = scoreItemsBatch(items, w);

        // 4) score DESC 정렬 → Top3
        List<ClothingItem> top = items.stream()
                .sorted(Comparator
                        .comparingDouble((ClothingItem it) -> scoreMap.getOrDefault(it.getId(), 0.0))
                        .reversed()
                        .thenComparing(ClothingItem::getSelectedCount, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ClothingItem::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                )
                .limit(TOP_N)
                .toList();

        // 5) 방어: 그래도 비면 후보 앞에서 Top3
        if (top.isEmpty()) {
            return items.stream()
                    .limit(TOP_N)
                    .map(ClothingItemResponseDto::from)
                    .toList();
        }

        safeLog(
                RecommendationEventType.RECO_GENERATED,
                """
                {"scope":"today-by-category-ml-batch","category":"%s","region":"%s","lat":%f,"lon":%f,"candidateLimit":%d,"candidateSize":%d,"resultSize":%d}
                """.formatted(category, region, lat, lon, resolvedLimit, items.size(), top.size())
        );

        return top.stream()
                .map(ClothingItemResponseDto::from)
                .toList();
    }

    private List<Long> fetchCandidateIds(ClothingCategory category, int limit) {
        ClothingItemRequestDto.SearchCondition cond = ClothingItemRequestDto.SearchCondition.builder()
                .category(category)
                .sort("popular")
                .limit(limit)
                .build();

        return clothingItemRepository.searchCandidateIds(cond, PageRequest.of(0, limit));
    }

    private List<ClothingItem> fetchOrderedEntities(List<Long> ids) {
        List<ClothingItem> rows = clothingItemRepository.findAllWithSeasonsByIdIn(ids);
        if (rows == null || rows.isEmpty()) return List.of();

        Map<Long, ClothingItem> map = rows.stream()
                .collect(Collectors.toMap(ClothingItem::getId, e -> e));

        List<ClothingItem> ordered = new ArrayList<>(ids.size());
        for (Long id : ids) {
            ClothingItem e = map.get(id);
            if (e != null) ordered.add(e);
        }
        return ordered;
    }

    private Map<Long, Double> scoreItemsBatch(List<ClothingItem> items, DailyWeatherResponseDto w) {
        // ✅ 날씨 feature(공통)
        double Ta = w.getFeelsLikeTemperature();
        int RH = w.getHumidity();
        double Va = w.getWindSpeed();
        int cloud = w.getCloudAmount();

        ComfortAiClient.Context ctx = new ComfortAiClient.Context(Ta, RH, Va, cloud);

        // ✅ 아이템 feature(개별)
        List<ComfortAiClient.Item> reqItems = items.stream()
                .map(it -> new ComfortAiClient.Item(
                        it.getId(),
                        it.getCottonPercentage() == null ? 0 : it.getCottonPercentage(),
                        it.getPolyesterPercentage() == null ? 0 : it.getPolyesterPercentage()
                ))
                .toList();

        Map<Long, Double> scoreMap = new HashMap<>(items.size());

        try {
            ComfortAiClient.BatchResponse res =
                    comfortAiClient.predictComfortBatch(new ComfortAiClient.BatchRequest(ctx, reqItems));

            if (res.results() != null) {
                for (ComfortAiClient.Result r : res.results()) {
                    double score = (r.error() == null ? r.comfortScore() : 0.0);
                    scoreMap.put(r.itemId(), score);
                }
            }
        } catch (Exception e) {
            // ✅ ML 전체 실패해도 추천 흐름은 유지 (전부 0점 처리)
            log.warn("[AI_BATCH_FAIL] reason={}", e.getMessage());
        }

        // 결과 누락 방어(응답에 없는 item은 0점)
        for (ClothingItem it : items) {
            scoreMap.putIfAbsent(it.getId(), 0.0);
        }

        return scoreMap;
    }

    // ==============================
    // Safe logging
    // ==============================
    private void safeLog(RecommendationEventType type, String payloadJson) {
        try {
            Map<String, Object> payloadMap = null;

            if (payloadJson != null && !payloadJson.isBlank()) {
                ObjectMapper om = new ObjectMapper();
                payloadMap = om.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
            }

            recommendationEventLogService.write(
                    RecommendationEventLogRequestDto.builder()
                            .eventType(type)
                            .sessionId(SYSTEM_SESSION_ID)
                            .sessionKey(SYSTEM_SESSION_KEY)
                            .payload(payloadMap)
                            .build()
            );
        } catch (DataAccessException | IllegalArgumentException | com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("[RECO_LOG_FAIL] type={} reason={}", type, e.getMessage());
        }
    }
}