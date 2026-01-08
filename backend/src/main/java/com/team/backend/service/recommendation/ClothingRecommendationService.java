// src/main/java/com/team/backend/service/recommendation/ClothingRecommendationService.java
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
    private static final String DEFAULT_THICKNESS = "NORMAL";

    // today 고정 구성(요구사항: 3/3/3)
    private static final int TODAY_PER_CATEGORY_POOL = 10;
    private static final int TODAY_PER_CATEGORY_PICK = 3;

    private final ClothingItemRepository clothingItemRepository;
    private final ClosetRepository closetRepository;

    private final WeatherService weatherService;
    private final RecommendationAiClient recommendationAiClient;
    private final FavoriteService favoriteService;

    // =========================
    // GET /api/recommend/today
    // ✅ AI 재정렬 제거
    // ✅ TOP/BOTTOM/OUTER 각 10개 뽑고, 각 3개씩 합쳐서 9개
    // =========================
    public List<ClothingItemResponseDto> recommendToday(
            String region,
            double lat,
            double lon,
            int limit,      // today는 고정 개수 정책 우선
            String sessionKey
    ) {
        var weather = weatherService.getTodaySmart(lat, lon, region);
        Integer temp = toTemp(weather.getFeelsLikeTemperature(), weather.getTemperature());

        Long closetId = null;
        if (sessionKey != null && !sessionKey.isBlank()) {
            closetId = resolveClosetId(sessionKey);
        }

        List<ClothingItem> out = new ArrayList<>();

        for (ClothingCategory category : List.of(ClothingCategory.TOP, ClothingCategory.BOTTOM, ClothingCategory.OUTER)) {
            ClothingItemRequestDto.SearchCondition cond = ClothingItemRequestDto.SearchCondition.builder()
                    .category(category)
                    .temp(temp)
                    .sort(SORT_DEFAULT)
                    .limit(TODAY_PER_CATEGORY_POOL)
                    .build();

            List<ClothingItem> pool = loadCandidatesScoped(cond, TODAY_PER_CATEGORY_POOL, closetId);
            List<ClothingItem> picked = pool.stream().limit(TODAY_PER_CATEGORY_PICK).toList();

            log.info("[TODAY] category={} pool={} picked={}", category, pool.size(), picked.size());
            out.addAll(picked);
        }

        return toResponse(out, sessionKey);
    }

    // =========================
    // GET /api/recommend/today/by-category
    // ✅ AI 재정렬 제거 (요청 limit 만큼 그대로 내려줌)
    // =========================
    public List<ClothingItemResponseDto> recommendTodayByCategory(
            ClothingCategory category,
            String region,
            double lat,
            double lon,
            int limit,
            String sessionKey
    ) {
        var weather = weatherService.getTodaySmart(lat, lon, region);
        Integer temp = toTemp(weather.getFeelsLikeTemperature(), weather.getTemperature());

        ClothingItemRequestDto.SearchCondition cond = ClothingItemRequestDto.SearchCondition.builder()
                .category(category)
                .temp(temp)
                .sort(SORT_DEFAULT)
                .limit(limit)
                .build();

        List<ClothingItem> candidates = loadCandidates(cond, limit, sessionKey);
        log.info("[TODAY_BY_CATEGORY] category={} limit={} returned={}", category, limit, candidates.size());

        return toResponse(candidates, sessionKey);
    }

    // =========================
    // POST /api/recommend/candidates
    // ✅ 여기서만 AI score 채움 + score 내림차순 정렬 보장
    // =========================
    public RecommendationCandidatesResponseDto getCandidates(RecommendationCandidatesRequestDto req, String sessionKey) {

        LocalDate clientDate = resolveClientDate(req);
        String recommendationKey = resolveRecommendationKey(req, clientDate);

        Long closetId = null;
        if (sessionKey != null && !sessionKey.isBlank()) {
            closetId = resolveClosetId(sessionKey);
        }

        var weather = weatherService.getTodaySmart(req.getLat(), req.getLon(), req.getRegion());
        Integer temp = toTemp(weather.getFeelsLikeTemperature(), weather.getTemperature());

        int topN = (req.getTopNPerCategory() == null ? 10 : req.getTopNPerCategory());
        var checklist = req.getChecklist();
        if (checklist == null) throw new IllegalArgumentException("checklist is required");

        Set<UsageType> usageTypes = expandUsageTypes(checklist.getUsageType());

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

            log.info("[CANDIDATES_POOL] recoKey={} category={} size={}", recommendationKey, category, candidates.size());
        }

        Set<Long> favSet = (sessionKey == null || sessionKey.isBlank())
                ? Set.of()
                : new HashSet<>(favoriteService.listFavoriteClothingIds(sessionKey));

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
                            .aiUsed(false)
                            .candidates(List.of())
                            .build());
                    continue;
                }

                try {
                    if (modelType == RecommendationModelType.BLEND_RATIO) {
                        RecommendationAiDto.BlendRatioRequest aiReq = buildBlendRequest(weather, candidates);
                        log.info("[AI_REQ][BLEND_RATIO] recoKey={} category={} items={}", recommendationKey, category, candidates.size());

                        RecommendationAiDto.BlendRatioResponse aiRes = recommendationAiClient.recommendBlendRatio(aiReq);
                        CandidateMapping mapped = mapBlendToCandidateDtosSorted(aiRes, candidates, favSet, topN);

                        log.info("[AI_MAP][BLEND_RATIO] recoKey={} category={} results={} matched={} aiUsed={} top3={}",
                                recommendationKey, category,
                                (aiRes == null || aiRes.results == null) ? 0 : aiRes.results.size(),
                                mapped.matchedCount, mapped.aiUsed, mappedTop3(mapped.candidates));

                        categoryDtos.add(RecommendationCandidatesResponseDto.CategoryCandidatesDto.builder()
                                .category(category)
                                .aiUsed(mapped.aiUsed)
                                .candidates(mapped.candidates)
                                .build());

                    } else {
                        RecommendationAiDto.MaterialRatioRequest aiReq = buildMaterialRequest(weather, candidates);
                        log.info("[AI_REQ][MATERIAL_RATIO] recoKey={} category={} items={}", recommendationKey, category, candidates.size());

                        RecommendationAiDto.MaterialRatioResponse aiRes = recommendationAiClient.recommendMaterialRatio(aiReq);
                        CandidateMapping mapped = mapMaterialToCandidateDtosSorted(aiRes, candidates, favSet, topN);

                        log.info("[AI_MAP][MATERIAL_RATIO] recoKey={} category={} results={} matched={} aiUsed={} top3={}",
                                recommendationKey, category,
                                (aiRes == null || aiRes.results == null) ? 0 : aiRes.results.size(),
                                mapped.matchedCount, mapped.aiUsed, mappedTop3(mapped.candidates));

                        categoryDtos.add(RecommendationCandidatesResponseDto.CategoryCandidatesDto.builder()
                                .category(category)
                                .aiUsed(mapped.aiUsed)
                                .candidates(mapped.candidates)
                                .build());
                    }

                } catch (Exception e) {
                    log.warn("[AI_FAIL] fallback. recoKey={} modelType={} category={}", recommendationKey, modelType, category, e);

                    categoryDtos.add(RecommendationCandidatesResponseDto.CategoryCandidatesDto.builder()
                            .category(category)
                            .aiUsed(false)
                            .candidates(fallbackCandidates(candidates, favSet, topN))
                            .build());
                }
            }

            models.add(RecommendationCandidatesResponseDto.ModelCandidatesDto.builder()
                    .modelType(modelType)
                    .categories(categoryDtos)
                    .build());
        }

        return RecommendationCandidatesResponseDto.builder()
                .recommendationKey(recommendationKey)
                .models(models)
                .build();
    }

    // =========================
    // Mapping wrapper
    // =========================
    private static class CandidateMapping {
        final List<RecommendationCandidatesResponseDto.CandidateDto> candidates;
        final boolean aiUsed;
        final int matchedCount;

        private CandidateMapping(List<RecommendationCandidatesResponseDto.CandidateDto> candidates, boolean aiUsed, int matchedCount) {
            this.candidates = candidates;
            this.aiUsed = aiUsed;
            this.matchedCount = matchedCount;
        }
    }

    private String mappedTop3(List<RecommendationCandidatesResponseDto.CandidateDto> list) {
        if (list == null || list.isEmpty()) return "[]";
        return list.stream()
                .limit(3)
                .map(d -> d.getClothingId() + ":" + d.getScore())
                .toList()
                .toString();
    }

    // =========================
    // candidates 응답용 매핑 + 정렬 (score desc)
    // =========================

    private CandidateMapping mapBlendToCandidateDtosSorted(
            RecommendationAiDto.BlendRatioResponse aiRes,
            List<ClothingItem> candidates,
            Set<Long> favSet,
            int limit
    ) {
        if (aiRes == null || aiRes.results == null || aiRes.results.isEmpty()) {
            return new CandidateMapping(fallbackCandidates(candidates, favSet, limit), false, 0);
        }

        Map<Long, Double> scoreMap = new HashMap<>();
        for (RecommendationAiDto.BlendRatioResult r : aiRes.results) {
            if (r == null || r.clothingId == null) continue;
            if (r.blendRatioScore == null) continue;
            scoreMap.put(r.clothingId, r.blendRatioScore);
        }

        List<RecommendationCandidatesResponseDto.CandidateDto> out = candidates.stream()
                .map(it -> RecommendationCandidatesResponseDto.CandidateDto.builder()
                        .clothingId(it.getClothingId())
                        .name(it.getName())
                        .color(it.getColor())
                        .imageUrl(it.getImageUrl())
                        .favorited(favSet.contains(it.getClothingId()))
                        .score(scoreMap.get(it.getClothingId()))
                        .analysis(scoreMap.containsKey(it.getClothingId()) ? "BLEND_RATIO" : "fallback")
                        .build())
                .toList();

        int matched = (int) out.stream().filter(d -> d.getScore() != null).count();
        if (matched == 0) {
            // results는 있는데 join=0 -> clothingId 불일치 가능성이 가장 큼
            return new CandidateMapping(fallbackCandidates(candidates, favSet, limit), false, 0);
        }

        List<RecommendationCandidatesResponseDto.CandidateDto> sorted = sortByScoreDesc(out);
        if (sorted.size() > limit) sorted = sorted.subList(0, limit);

        return new CandidateMapping(sorted, true, matched);
    }

    private CandidateMapping mapMaterialToCandidateDtosSorted(
            RecommendationAiDto.MaterialRatioResponse aiRes,
            List<ClothingItem> candidates,
            Set<Long> favSet,
            int limit
    ) {
        if (aiRes == null || aiRes.results == null || aiRes.results.isEmpty()) {
            return new CandidateMapping(fallbackCandidates(candidates, favSet, limit), false, 0);
        }

        Map<Long, Double> scoreMap = new HashMap<>();
        Map<Long, String> analysisMap = new HashMap<>();

        for (RecommendationAiDto.MaterialRatioResult r : aiRes.results) {
            if (r == null || r.clothingId == null) continue;
            if (r.materialRatioScore == null) continue;
            scoreMap.put(r.clothingId, r.materialRatioScore);
            if (r.analysis != null) analysisMap.put(r.clothingId, r.analysis);
        }

        List<RecommendationCandidatesResponseDto.CandidateDto> out = candidates.stream()
                .map(it -> {
                    Double s = scoreMap.get(it.getClothingId());
                    return RecommendationCandidatesResponseDto.CandidateDto.builder()
                            .clothingId(it.getClothingId())
                            .name(it.getName())
                            .color(it.getColor())
                            .imageUrl(it.getImageUrl())
                            .favorited(favSet.contains(it.getClothingId()))
                            .score(s)
                            .analysis(s != null ? analysisMap.getOrDefault(it.getClothingId(), "MATERIAL_RATIO") : "fallback")
                            .build();
                })
                .toList();

        int matched = (int) out.stream().filter(d -> d.getScore() != null).count();
        if (matched == 0) {
            return new CandidateMapping(fallbackCandidates(candidates, favSet, limit), false, 0);
        }

        List<RecommendationCandidatesResponseDto.CandidateDto> sorted = sortByScoreDesc(out);
        if (sorted.size() > limit) sorted = sorted.subList(0, limit);

        return new CandidateMapping(sorted, true, matched);
    }

    private List<RecommendationCandidatesResponseDto.CandidateDto> sortByScoreDesc(
            List<RecommendationCandidatesResponseDto.CandidateDto> list
    ) {
        ArrayList<RecommendationCandidatesResponseDto.CandidateDto> sorted = new ArrayList<>(list);

        Comparator<RecommendationCandidatesResponseDto.CandidateDto> cmp =
                Comparator
                        .comparing((RecommendationCandidatesResponseDto.CandidateDto d) -> d.getScore() == null)
                        .thenComparing(RecommendationCandidatesResponseDto.CandidateDto::getScore,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(RecommendationCandidatesResponseDto.CandidateDto::getClothingId,
                                Comparator.nullsLast(Comparator.naturalOrder()));

        sorted.sort(cmp);
        return sorted;
    }

    // =========================
    // AI Request builders (DTO 기준으로 교체)
    // =========================

    private RecommendationAiDto.BlendRatioRequest buildBlendRequest(DailyWeatherResponseDto w, List<ClothingItem> items) {
        Number cloud = w.getCloudAmount(); // Integer일 수도 있고 Double일 수도 있으니 Number로 받기

        RecommendationAiDto.BlendContext ctx = new RecommendationAiDto.BlendContext(
                w.getTemperature(),
                (w.getHumidity() == null ? null : w.getHumidity().doubleValue()),
                w.getWindSpeed(),
                (cloud == null ? null : cloud.doubleValue()),
                w.getMaxTemperature(),
                w.getMinTemperature(),
                (w.getSky() == null ? null : w.getSky().toString())
        );

        List<RecommendationAiDto.BlendItemReq> aiItems = items.stream()
                .map(i -> new RecommendationAiDto.BlendItemReq(
                        i.getClothingId(),
                        clampRatio(i.getCottonPercentage()),
                        (i.getThicknessLevel() == null ? DEFAULT_THICKNESS : i.getThicknessLevel().name())
                ))
                .toList();

        return new RecommendationAiDto.BlendRatioRequest(ctx, aiItems);
    }

    private RecommendationAiDto.MaterialRatioRequest buildMaterialRequest(DailyWeatherResponseDto w, List<ClothingItem> items) {
        RecommendationAiDto.MaterialWeather weather = new RecommendationAiDto.MaterialWeather(
                w.getTemperature(),
                w.getFeelsLikeTemperature(),
                w.getMaxTemperature(),
                w.getMinTemperature(),
                w.getHumidity(),
                w.getPrecipitationProbability(),
                w.getWindSpeed()
        );

        List<RecommendationAiDto.MaterialItemReq> aiItems = items.stream()
                .map(i -> new RecommendationAiDto.MaterialItemReq(
                        i.getClothingId(),
                        pickMaterialName(i),
                        (i.getThicknessLevel() == null ? DEFAULT_THICKNESS : i.getThicknessLevel().name()),
                        i.getColor()
                ))
                .toList();

        return new RecommendationAiDto.MaterialRatioRequest(aiItems, weather);
    }

    private String pickMaterialName(ClothingItem i) {
        String st = i.getStyleTag();
        if (st != null && !st.isBlank()) return st;
        return i.getName();
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

    private Integer clampRatio(Integer v) {
        if (v == null) return 0;
        if (v < 0) return 0;
        if (v > 100) return 100;
        return v;
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

    private List<RecommendationCandidatesResponseDto.CandidateDto> fallbackCandidates(
            List<ClothingItem> candidates,
            Set<Long> favSet,
            int limit
    ) {
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