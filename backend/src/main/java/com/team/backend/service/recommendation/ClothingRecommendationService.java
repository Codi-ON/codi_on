// src/main/java/com/team/backend/service/recommendation/ClothingRecommendationService.java
package com.team.backend.service.recommendation;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.service.ai.RecommendationAiClient;
import com.team.backend.service.ai.dto.RecommendationAiDto;
import com.team.backend.service.favorite.FavoriteService;
import com.team.backend.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClothingRecommendationService {

    private static final int TOP_K = 3;

    private final ClothingItemRepository clothingItemRepository;
    private final WeatherService weatherService;
    private final RecommendationAiClient recommendationAiClient;
    private final RecommendationEventLogService recommendationEventLogService;
    private final FavoriteService favoriteService;

    public List<ClothingItemResponseDto> recommendToday(String region, double lat, double lon, int limit, String sessionKey) {
        var weather = weatherService.getTodaySmart(lat, lon, region);

        Integer temp = toTemp(weather.getFeelsLikeTemperature(), weather.getTemperature());
        ClothingItemRequestDto.SearchCondition cond = ClothingItemRequestDto.SearchCondition.builder()
                .temp(temp)
                .sort("popular")
                .limit(limit)
                .build();

        List<ClothingItem> candidates = loadCandidates(cond, limit);
        RecommendationAiDto.RecommendationRequest req = buildAiRequest(weather, candidates);

        RecommendationAiDto.RecommendationResponse aiRes = recommendByMaterialML(req);
        List<ClothingItem> picked = mapAiToEntities(aiRes, candidates);

        return toResponse(picked, sessionKey);
    }

    public List<ClothingItemResponseDto> recommendTodayByCategory(ClothingCategory category, String region, double lat, double lon, int limit, String sessionKey) {
        var weather = weatherService.getTodaySmart(lat, lon, region);

        Integer temp = toTemp(weather.getFeelsLikeTemperature(), weather.getTemperature());
        ClothingItemRequestDto.SearchCondition cond = ClothingItemRequestDto.SearchCondition.builder()
                .category(category)
                .temp(temp)
                .sort("popular")
                .limit(limit)
                .build();

        List<ClothingItem> candidates = loadCandidates(cond, limit);
        RecommendationAiDto.RecommendationRequest req = buildAiRequest(weather, candidates);

        RecommendationAiDto.RecommendationResponse aiRes = recommendByMaterialML(req);
        List<ClothingItem> picked = mapAiToEntities(aiRes, candidates);

        return toResponse(picked, sessionKey);
    }

    // =========================
    // 후보 풀 로딩: Custom repo 기반
    // =========================
    private List<ClothingItem> loadCandidates(ClothingItemRequestDto.SearchCondition cond, int limit) {
        // ✅ custom query로 id만 먼저 뽑기
        List<Long> ids = clothingItemRepository.searchCandidateIds(cond, PageRequest.of(0, limit));
        if (ids.isEmpty()) return List.of();

        // ✅ seasons까지 함께 로딩
        List<ClothingItem> loaded = clothingItemRepository.findAllWithSeasonsByIdIn(ids);

        // ✅ id 순서 유지(ML 입력/후보 순서 안정화)
        Map<Long, ClothingItem> map = loaded.stream()
                .collect(Collectors.toMap(ClothingItem::getId, Function.identity(), (a, b) -> a));

        List<ClothingItem> ordered = new ArrayList<>(loaded.size());
        for (Long id : ids) {
            ClothingItem it = map.get(id);
            if (it != null) ordered.add(it);
        }
        return ordered;
    }

    private Integer toTemp(Double feels, Double temp) {
        Double v = (feels != null && Double.isFinite(feels)) ? feels : temp;
        if (v == null || !Double.isFinite(v)) return null;
        return (int) Math.round(v);
    }

    // =========================
    // AI
    // =========================
    public RecommendationAiDto.RecommendationResponse recommendByMaterialML(RecommendationAiDto.RecommendationRequest req) {
        long startedAt = System.currentTimeMillis();
        try {
            RecommendationAiDto.RecommendationResponse res = recommendationAiClient.recommend(req);

            if (res == null || res.recommendations == null) {
                safeLog(RecommendationEventType.RECO_ERROR, Map.of("type", "AI_NULL", "latencyMs", System.currentTimeMillis() - startedAt));
                return fallbackTopK(req, "ai_null");
            }

            // score desc, null은 뒤로
            List<RecommendationAiDto.Recommendation> cleaned = res.recommendations.stream()
                    .filter(Objects::nonNull)
                    .filter(r -> r.clothingId != null)
                    .sorted((a, b) -> {
                        Double sa = a.score;
                        Double sb = b.score;
                        if (sa == null && sb == null) return 0;
                        if (sa == null) return 1;
                        if (sb == null) return -1;
                        return Double.compare(sb, sa);
                    })
                    .limit(TOP_K)
                    .toList();

            res.recommendations = cleaned;

            safeLog(RecommendationEventType.RECO_GENERATED, Map.of(
                    "type", "MATERIAL_AI_RECOMMEND",
                    "latencyMs", System.currentTimeMillis() - startedAt,
                    "pickedCount", cleaned.size()
            ));

            if (cleaned.isEmpty()) return fallbackTopK(req, "ai_empty");
            return res;

        } catch (Exception e) {
            safeLog(RecommendationEventType.RECO_ERROR, Map.of(
                    "type", "AI_EXCEPTION",
                    "errorType", e.getClass().getSimpleName(),
                    "message", e.getMessage()
            ));
            return fallbackTopK(req, "ai_exception");
        }
    }

    private RecommendationAiDto.RecommendationRequest buildAiRequest(Object weatherDto, List<ClothingItem> items) {
        // 너 Weather DTO 타입이 DailyWeatherResponseDto면 여기 타입을 그걸로 바꿔도 됨.
        // 여기서는 "getter가 있다"는 전제로만 사용.
        var w = (com.team.backend.api.dto.weather.DailyWeatherResponseDto) weatherDto;

        List<RecommendationAiDto.Item> aiItems = items.stream()
                .map(i -> new RecommendationAiDto.Item(i.getClothingId(), i.getName(), i.getCategory().name()))
                .toList();

        return new RecommendationAiDto.RecommendationRequest(
                aiItems,
                new RecommendationAiDto.WeatherData(
                        w.getTemperature(),
                        w.getFeelsLikeTemperature(),
                        w.getHumidity(),
                        w.getPrecipitationProbability()
                )
        );
    }

    private List<ClothingItem> mapAiToEntities(RecommendationAiDto.RecommendationResponse aiRes, List<ClothingItem> candidates) {
        if (aiRes == null || aiRes.recommendations == null || aiRes.recommendations.isEmpty()) return List.of();

        Map<Long, ClothingItem> byClothingId = candidates.stream()
                .collect(Collectors.toMap(ClothingItem::getClothingId, Function.identity(), (a, b) -> a));

        List<ClothingItem> out = new ArrayList<>();
        for (RecommendationAiDto.Recommendation r : aiRes.recommendations) {
            ClothingItem it = byClothingId.get(r.clothingId);
            if (it != null) out.add(it);
        }
        return out;
    }

    private List<ClothingItemResponseDto> toResponse(List<ClothingItem> items, String sessionKey) {
        Set<Long> favSet = (sessionKey == null || sessionKey.isBlank())
                ? Set.of()
                : new HashSet<>(favoriteService.listFavoriteClothingIds(sessionKey));

        return items.stream()
                .map(it -> ClothingItemResponseDto.from(it, favSet.contains(it.getClothingId())))
                .toList();
    }

    private RecommendationAiDto.RecommendationResponse fallbackTopK(RecommendationAiDto.RecommendationRequest req, String reason) {
        List<RecommendationAiDto.Recommendation> fallback = new ArrayList<>();
        if (req != null && req.items != null) {
            for (RecommendationAiDto.Item it : req.items) {
                RecommendationAiDto.Recommendation r = new RecommendationAiDto.Recommendation();
                r.clothingId = it.clothingId;
                r.name = it.name;
                r.score = null;
                r.analysis = "fallback:" + reason;
                fallback.add(r);
                if (fallback.size() >= TOP_K) break;
            }
        }
        RecommendationAiDto.RecommendationResponse res = new RecommendationAiDto.RecommendationResponse();
        res.status = "fallback";
        res.message = reason;
        res.recommendations = fallback;
        return res;
    }

    private void safeLog(RecommendationEventType type, Map<String, Object> payload) {
        try {
            recommendationEventLogService.write(
                    RecommendationEventLogRequestDto.builder()
                            .eventType(type)
                            .sessionKey("SYSTEM")
                            .payload(payload)
                            .build()
            );
        } catch (Exception ignore) {}
    }
}