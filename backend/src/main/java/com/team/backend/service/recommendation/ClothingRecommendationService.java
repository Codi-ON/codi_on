package com.team.backend.service.recommendation;

import com.team.backend.api.dto.clothingItem.ClothingItemRequestDto;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.api.dto.recommendation.RecommendationCandidatesRequestDto;
import com.team.backend.api.dto.recommendation.RecommendationCandidatesResponseDto;
import com.team.backend.api.dto.weather.DailyWeatherResponseDto;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.domain.enums.UsageType;
import com.team.backend.domain.enums.recommendation.RecommendationModelType;
import com.team.backend.repository.closet.ClosetRepository;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.service.ai.dto.RecommendationAiClient;
import com.team.backend.service.ai.dto.RecommendationAiDto;
import com.team.backend.service.favorite.FavoriteService;
import com.team.backend.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class ClothingRecommendationService {

    private static final String SORT_DEFAULT = "popular";

    private final ClothingItemRepository clothingItemRepository;
    private final ClosetRepository closetRepository;

    private final WeatherService weatherService;
    private final RecommendationAiClient recommendationAiClient;
    private final FavoriteService favoriteService;

    // =========================
    // GET /api/recommend/today
    // - 기존 유지(단, sessionKey 있으면 closet-only로 후보 제한)
    // =========================
    public List<ClothingItemResponseDto> recommendToday(
            String region,
            double lat,
            double lon,
            int limit,
            String sessionKey
    ) {
        var weather = weatherService.getTodaySmart(lat, lon, region);
        Integer temp = toTemp(weather.getFeelsLikeTemperature(), weather.getTemperature());

        ClothingItemRequestDto.SearchCondition cond = ClothingItemRequestDto.SearchCondition.builder()
                .temp(temp)
                .sort(SORT_DEFAULT)
                .limit(limit)
                .build();

        List<ClothingItem> candidates = loadCandidates(cond, limit, sessionKey);
        if (candidates.isEmpty()) return List.of();

        RecommendationAiDto.RecommendationRequest aiReq = buildAiRequest(weather, candidates);
        RecommendationAiDto.RecommendationResponse aiRes = recommendationAiClient.recommendMaterialRatio(aiReq);

        List<ClothingItem> picked = mapAiToEntities(aiRes, candidates, Math.min(limit, candidates.size()));
        return toResponse(picked, sessionKey);
    }

    // =========================
    // GET /api/recommend/today/by-category
    // =========================
    public List<ClothingItemResponseDto> recommendTodayByCategory(

            ClothingCategory category,
            String region,
            double lat,
            double lon,
            int limit,
            String sessionKey
    ) {
        log.info("recommendTodayByCategory start. category={}, region={}, lat={}, lon={}, limit={}, sessionKeyPresent={}",
        category, region, lat, lon, limit, sessionKey != null && !sessionKey.isBlank());
        var weather = weatherService.getTodaySmart(lat, lon, region);
        Integer temp = toTemp(weather.getFeelsLikeTemperature(), weather.getTemperature());

        ClothingItemRequestDto.SearchCondition cond = ClothingItemRequestDto.SearchCondition.builder()
                .category(category)
                .temp(temp)
                .sort(SORT_DEFAULT)
                .limit(limit)
                .build();

        List<ClothingItem> candidates = loadCandidates(cond, limit, sessionKey);
        if (candidates.isEmpty()) return List.of();

        RecommendationAiDto.RecommendationRequest aiReq = buildAiRequest(weather, candidates);
        RecommendationAiDto.RecommendationResponse aiRes = recommendationAiClient.recommendMaterialRatio(aiReq);

        List<ClothingItem> picked = mapAiToEntities(aiRes, candidates, Math.min(limit, candidates.size()));
        return toResponse(picked, sessionKey);
    }

    // =========================
    // POST /api/recommend/candidates
    // - sessionKey 있으면 closet-only
    // - sessionKey null/blank면 전체풀 fallback
    // - 모델 2개 각각 + 카테고리별 TopN
    // =========================
    public RecommendationCandidatesResponseDto getCandidates(RecommendationCandidatesRequestDto req, String sessionKey) {

        // 0) date / key 기준 통일 (KST)
        LocalDate clientDate = resolveClientDate(req);
        String recommendationKey = resolveRecommendationKey(req, clientDate);

        // 1) closet 범위 결정: sessionKey 없으면 전체풀
        Long closetId = null;
        if (sessionKey != null && !sessionKey.isBlank()) {
            closetId = resolveClosetId(sessionKey);
        }

        // 2) weather
        var weather = weatherService.getTodaySmart(req.getLat(), req.getLon(), req.getRegion());
        Integer temp = toTemp(weather.getFeelsLikeTemperature(), weather.getTemperature());

        int topN = (req.getTopNPerCategory() == null ? 10 : req.getTopNPerCategory());
        var checklist = req.getChecklist();

        // checklist는 @NotNull이라 가정하지만, 방어적으로 한 번 더
        if (checklist == null) {
            throw new IllegalArgumentException("checklist is required");
        }

        Set<UsageType> usageTypes = expandUsageTypes(checklist.getUsageType());

        // 3) 카테고리별 후보 로딩 (closetId 있으면 closet-only, 없으면 전체풀)
        Map<ClothingCategory, List<ClothingItem>> candidatesByCategory = new LinkedHashMap<>();
        for (ClothingCategory category : ClothingCategory.values()) {

            ClothingItemRequestDto.SearchCondition cond = ClothingItemRequestDto.SearchCondition.builder()
                    .category(category)
                    .temp(temp)
                    .thicknessLevel(checklist.getThicknessLevel())
                    .usageTypes(usageTypes)
                    .sort(SORT_DEFAULT)
                    .limit(topN)
                    .build();

            List<ClothingItem> candidates = loadCandidatesScoped(cond, topN, closetId);
            candidatesByCategory.put(category, candidates);
        }

        // 4) favorites (sessionKey 없으면 empty)
        Set<Long> favSet = (sessionKey == null || sessionKey.isBlank())
                ? Set.of()
                : new HashSet<>(favoriteService.listFavoriteClothingIds(sessionKey));

        // 5) 모델 2개 각각 호출 → 모델별/카테고리별 후보 리스트 구성
        List<RecommendationCandidatesResponseDto.ModelCandidatesDto> models = new ArrayList<>();

        for (RecommendationModelType modelType : List.of(
                RecommendationModelType.BLEND_RATIO,
                RecommendationModelType.MATERIAL_RATIO
        )) {

            List<RecommendationCandidatesResponseDto.CategoryCandidatesDto> categoryDtos = new ArrayList<>();

            for (var entry : candidatesByCategory.entrySet()) {
                ClothingCategory category = entry.getKey();
                List<ClothingItem> candidates = entry.getValue();

                if (candidates == null || candidates.isEmpty()) {
                    categoryDtos.add(RecommendationCandidatesResponseDto.CategoryCandidatesDto.builder()
                            .category(category)
                            .candidates(List.of())
                            .build());
                    continue;
                }

                RecommendationAiDto.RecommendationRequest aiReq = buildAiRequest(weather, candidates);
                RecommendationAiDto.RecommendationResponse aiRes = callAi(modelType, aiReq);

                List<RecommendationCandidatesResponseDto.CandidateDto> out =
                        mapAiToCandidateDtos(aiRes, candidates, favSet, topN);

                categoryDtos.add(RecommendationCandidatesResponseDto.CategoryCandidatesDto.builder()
                        .category(category)
                        .candidates(out)
                        .build());
            }

            models.add(RecommendationCandidatesResponseDto.ModelCandidatesDto.builder()
                    .RecommendationModelType(modelType)   // DTO 필드명이 다르면 여기만 너 DTO에 맞게 바꾸면 끝
                    .categories(categoryDtos)
                    .build());
        }

        return RecommendationCandidatesResponseDto.builder()
                .recommendationKey(recommendationKey)
                .models(models)
                .build();
    }

    // =========================
    // 내부 유틸
    // =========================
    private LocalDate resolveClientDate(RecommendationCandidatesRequestDto req) {
        if (req == null || req.getChecklist() == null) return TimeRanges.todayKst();
        if (req.getChecklist().getClientDateISO() == null) return TimeRanges.todayKst();
        return req.getChecklist().getClientDateISO();
    }

    private String resolveRecommendationKey(RecommendationCandidatesRequestDto req, LocalDate clientDate) {
        if (req != null && req.getRecommendationKey() != null && !req.getRecommendationKey().isBlank()) {
            return req.getRecommendationKey();
        }
        return "RECO-" + TimeRanges.ymCompact(clientDate);
    }

    private Long resolveClosetId(String sessionKey) {
        return closetRepository.findBySessionKey(sessionKey)
                .map(c -> c.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "sessionKey에 해당하는 closet이 없습니다. sessionKey=" + sessionKey
                ));
    }

    private Set<UsageType> expandUsageTypes(UsageType base) {
        if (base == null) return Set.of();
        if (base == UsageType.BOTH) return Set.of(UsageType.BOTH);
        return Set.of(base, UsageType.BOTH);
    }

    private Integer toTemp(Double feels, Double temp) {
        Double v = (feels != null && Double.isFinite(feels)) ? feels : temp;
        if (v == null || !Double.isFinite(v)) return null;
        return (int) Math.round(v);
    }

    private List<ClothingItem> loadCandidates(ClothingItemRequestDto.SearchCondition cond, int limit, String sessionKey) {
        Long closetId = null;
        if (sessionKey != null && !sessionKey.isBlank()) {
            closetId = resolveClosetId(sessionKey);
        }
        return loadCandidatesScoped(cond, limit, closetId);
    }

    private List<ClothingItem> loadCandidatesScoped(ClothingItemRequestDto.SearchCondition cond, int limit, Long closetId) {
        List<Long> ids;

        if (closetId != null) {
            ids = clothingItemRepository.searchCandidateIdsInCloset(closetId, cond, PageRequest.of(0, limit));
        } else {
            ids = clothingItemRepository.searchCandidateIds(cond, PageRequest.of(0, limit));
        }

        if (ids == null || ids.isEmpty()) return List.of();

        List<ClothingItem> loaded = clothingItemRepository.findAllByIdIn(ids);
        return orderByIds(ids, loaded);
    }

    private List<ClothingItem> orderByIds(List<Long> ids, List<ClothingItem> loaded) {
        Map<Long, ClothingItem> map = loaded.stream()
                .collect(Collectors.toMap(ClothingItem::getId, Function.identity(), (a, b) -> a));

        List<ClothingItem> ordered = new ArrayList<>(ids.size());
        for (Long id : ids) {
            ClothingItem it = map.get(id);
            if (it != null) ordered.add(it);
        }
        return ordered;
    }

    // =========================
    // AI Request: 최신 RecommendationAiDto 스펙 정합
    // =========================
    private RecommendationAiDto.RecommendationRequest buildAiRequest(
            DailyWeatherResponseDto w,
            List<ClothingItem> items
    ) {
        List<RecommendationAiDto.Item> aiItems = items.stream()
                .map(i -> new RecommendationAiDto.Item(
                        i.getClothingId(),
                        i.getName(),
                        i.getCategory().name(),
                        i.getThicknessLevel() == null ? null : i.getThicknessLevel().name(),
                        i.getColor()
                ))
                .toList();

        RecommendationAiDto.WeatherData weather = new RecommendationAiDto.WeatherData(
                w.getTemperature(),
                w.getFeelsLikeTemperature(),
                w.getMaxTemperature(),
                w.getMinTemperature(),
                w.getHumidity(),
                w.getPrecipitationProbability(),
                w.getWindSpeed()
        );

        return new RecommendationAiDto.RecommendationRequest(aiItems, weather);
    }

    private RecommendationAiDto.RecommendationResponse callAi(RecommendationModelType modelType, RecommendationAiDto.RecommendationRequest req) {
        return switch (modelType) {
            case BLEND_RATIO -> recommendationAiClient.recommendBlendRatio(req);
            case MATERIAL_RATIO -> recommendationAiClient.recommendMaterialRatio(req);
        };
    }

    private List<ClothingItem> mapAiToEntities(
            RecommendationAiDto.RecommendationResponse aiRes,
            List<ClothingItem> candidates,
            int limit
    ) {
        if (aiRes == null || aiRes.recommendations == null || aiRes.recommendations.isEmpty()) {
            return candidates.stream().limit(limit).toList();
        }

        Map<Long, ClothingItem> byClothingId = candidates.stream()
                .collect(Collectors.toMap(ClothingItem::getClothingId, Function.identity(), (a, b) -> a));

        List<ClothingItem> out = new ArrayList<>();
        for (RecommendationAiDto.Recommendation r : aiRes.recommendations) {
            if (r == null || r.clothingId == null) continue;
            ClothingItem it = byClothingId.get(r.clothingId);
            if (it != null) out.add(it);
            if (out.size() >= limit) break;
        }

        if (out.isEmpty()) return candidates.stream().limit(limit).toList();
        return out;
    }

    private List<RecommendationCandidatesResponseDto.CandidateDto> mapAiToCandidateDtos(
            RecommendationAiDto.RecommendationResponse aiRes,
            List<ClothingItem> candidates,
            Set<Long> favSet,
            int limit
    ) {
        Map<Long, ClothingItem> byClothingId = candidates.stream()
                .collect(Collectors.toMap(ClothingItem::getClothingId, Function.identity(), (a, b) -> a));

        if (aiRes != null && aiRes.recommendations != null && !aiRes.recommendations.isEmpty()) {
            List<RecommendationCandidatesResponseDto.CandidateDto> out = new ArrayList<>();
            for (RecommendationAiDto.Recommendation r : aiRes.recommendations) {
                if (r == null || r.clothingId == null) continue;
                ClothingItem it = byClothingId.get(r.clothingId);
                if (it == null) continue;

                out.add(RecommendationCandidatesResponseDto.CandidateDto.builder()
                        .clothingId(it.getClothingId())
                        .name(it.getName())
                        .color(it.getColor())
                        .imageUrl(it.getImageUrl())
                        .favorited(favSet.contains(it.getClothingId()))
                        .score(r.score)
                        .analysis(r.analysis)
                        .build());

                if (out.size() >= limit) break;
            }
            if (!out.isEmpty()) return out;
        }

        return candidates.stream()
                .limit(limit)
                .map(it -> RecommendationCandidatesResponseDto.CandidateDto.builder()
                        .clothingId(it.getClothingId())
                        .name(it.getName())
                        .color(it.getColor())
                        .imageUrl(it.getImageUrl())
                        .favorited(favSet.contains(it.getClothingId()))
                        .score(null)
                        .analysis("fallback")
                        .build())
                .toList();
    }

    private List<ClothingItemResponseDto> toResponse(List<ClothingItem> items, String sessionKey) {
        Set<Long> favSet = (sessionKey == null || sessionKey.isBlank())
                ? Set.of()
                : new HashSet<>(favoriteService.listFavoriteClothingIds(sessionKey));

        return items.stream()
                .map(it -> ClothingItemResponseDto.from(it, favSet.contains(it.getClothingId())))
                .toList();
    }
}