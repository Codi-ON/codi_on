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
import com.team.backend.service.ai.ComfortAiClient;
import com.team.backend.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

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

    private final ObjectProvider<MeterRegistry> meterRegistryProvider;

    // 운영 정책
    private static final int TOP_K = 3;
    private static final int FALLBACK_FILL_LIMIT = 50;

    // 로그가 추천 흐름을 죽이면 안 됨 → 시스템 기본값
    private static final UUID SYSTEM_SESSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String SYSTEM_SESSION_KEY = "SYSTEM";

    private record ComfortContext(int avgTemp, ComfortZone zone, DailyWeatherResponseDto weather) {
    }

    private ComfortContext resolveComfortContext(double lat, double lon, String region) {
        DailyWeatherResponseDto today = weatherService.getTodaySmart(lat, lon, region);
        int avgTemp = (int) Math.round(today.getTemperature());
        ComfortZone zone = ComfortZone.from(avgTemp);
        return new ComfortContext(avgTemp, zone, today);
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
                            .eventType(type)
                            .sessionId(SYSTEM_SESSION_ID)
                            .sessionKey(SYSTEM_SESSION_KEY)
                            .payload(payloadMap)
                            .build()
            );
        } catch (Exception e) {
            log.warn("[RECO_LOG_FAIL] type={} reason={}", type, e.getMessage());
        }
    }

    private int clampRatio(Integer v) {
        int x = (v == null ? 0 : v);
        if (x < 0) return 0;
        return Math.min(x, 100);
    }

    private boolean isFinite(Double v) {
        return v != null && Double.isFinite(v);
    }

    // =========================
    // Public APIs
    // =========================

    /**
     * /api/recommend/today
     * - "전체"라고 해도 실제 반환은 카테고리별 Top3를 합친 결과(예: TOP/BOTTOM/OUTER → 총 9개)
     * - limit은 "후보 풀 크기"로 사용 (최종 TopK는 고정)
     */
    public List<ClothingItemResponseDto> recommendToday(String region, double lat, double lon, int limit) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());

        // 프로젝트 정책상 필요한 카테고리만
        List<ClothingCategory> categories = List.of(
                ClothingCategory.TOP,
                ClothingCategory.BOTTOM,
                ClothingCategory.OUTER
        );

        List<ClothingItemResponseDto> merged = new ArrayList<>();
        for (ClothingCategory c : categories) {
            merged.addAll(recommendTopKByCategory(c, region, lat, lon, limit, ctx, todaySeasons));
        }
        return merged;
    }

    /**
     * /api/recommend/today/by-category
     * - 해당 카테고리 Top3만 반환
     */
    @Transactional(readOnly = true)
    public List<ClothingItemResponseDto> recommendTodayByCategory(
            ClothingCategory category, String region, double lat, double lon, int limit
    ) {
        ComfortContext ctx = resolveComfortContext(lat, lon, region);
        Set<SeasonType> todaySeasons = resolveSeasons(ctx.zone());
        return recommendTopKByCategory(category, region, lat, lon, limit, ctx, todaySeasons);
    }

    // =========================
    // Core
    // =========================

    private List<ClothingItemResponseDto> recommendTopKByCategory(
            ClothingCategory category,
            String region, double lat, double lon,
            int candidateLimit,
            ComfortContext ctx,
            Set<SeasonType> todaySeasons
    ) {
        // 1) 후보 ID 확보 (정렬은 후보 추출용일 뿐, 최종 정렬은 ML score)
        ClothingItemRequestDto.Search req = ClothingItemRequestDto.Search.builder()
                .category(category)
                .temp(ctx.avgTemp())
                .sort("popular")
                .limit(candidateLimit)
                .build();

        List<Long> ids = clothingItemRepository.searchCandidateIds(
                req.toCondition(),
                PageRequest.of(0, req.resolvedLimit())
        );

        if (ids.isEmpty()) return List.of(); // 후보 자체가 없으면 진짜 없음

        // 2) 엔티티 로딩 + 순서 유지
        List<ClothingItem> rows = clothingItemRepository.findAllWithSeasonsByIdIn(ids);
        Map<Long, ClothingItem> map = new HashMap<>();
        for (ClothingItem e : rows) map.put(e.getId(), e);

        List<ClothingItem> ordered = new ArrayList<>();
        for (Long id : ids) {
            ClothingItem item = map.get(id);
            if (item != null) ordered.add(item);
        }

        // 3) 룰(체크리스트) 필터링: zone/season (여기서 걸러진 것만 ML로 점수)
        List<ClothingItem> filtered = ordered.stream()
                .filter(it -> ctx.zone().matches(it))
                .filter(it -> matchesSeason(it, todaySeasons))
                .toList();

        // 필터 결과가 0이면: “조건에 맞는 걸 내뱉게” 정책 → 룰을 완화해서라도 뽑는다(후보 상위에서 TopK)
        if (filtered.isEmpty()) {
            return ordered.stream()
                    .limit(TOP_K)
                    .map(ClothingItemResponseDto::from)
                    .toList();
        }

        // 4) AI batch 요청 구성 (Weather → context, Item → material ratio)
        DailyWeatherResponseDto w = ctx.weather();

        double Ta = (w.getFeelsLikeTemperature() != 0.0 ? w.getFeelsLikeTemperature() : w.getTemperature());
        int RH = Math.max(0, Math.min(100, w.getHumidity()));
        double Va = Math.max(0.0, w.getWindSpeed());
        int cloud = Math.max(0, Math.min(100, w.getCloudAmount()));

        List<ComfortAiClient.Item> aiItems = filtered.stream()
                .map(it -> new ComfortAiClient.Item(
                        it.getId(), // item_id = PK id 로 매핑
                        clampRatio(it.getCottonPercentage()),
                        clampRatio(it.getPolyesterPercentage())
                ))
                .toList();

        ComfortAiClient.BatchRequest aiReq = new ComfortAiClient.BatchRequest(
                new ComfortAiClient.Context(Ta, RH, Va, cloud),
                aiItems
        );

        // 5) AI 호출 + 관측(로그/메트릭)
        MeterRegistry mr = meterRegistryProvider.getIfAvailable();

        long t0 = System.currentTimeMillis();
        ComfortAiClient.BatchResponse aiRes;

        Timer.Sample sample = (mr == null ? null : Timer.start(mr));
        try {
            aiRes = comfortAiClient.predictComfortBatch(aiReq);
            if (mr != null) mr.counter("ai_comfort_batch_calls_total", "status", "success").increment();
        } catch (Exception e) {
            if (mr != null) mr.counter("ai_comfort_batch_calls_total", "status", "fail").increment();

            log.warn("[AI_COMFORT_BATCH_FAIL] category={} reason={}", category, e.getMessage());

            // AI 죽어도 추천 API는 살아야 함 → 필터 결과에서 TopK fallback
            return filtered.stream()
                    .limit(TOP_K)
                    .map(ClothingItemResponseDto::from)
                    .toList();
        } finally {
            if (sample != null) {
                sample.stop(Timer.builder("ai_comfort_batch_latency_ms")
                        .description("AI comfort batch latency")
                        .publishPercentiles(0.5, 0.95, 0.99)
                        .register(mr));
            }
        }

        long latencyMs = System.currentTimeMillis() - t0;

        List<ComfortAiClient.Result> results = aiRes.results;

        long okCount = results.stream()
                .filter(r -> r.error == null)
                .filter(r -> isFinite(r.comfortScore))
                .count();
        long errCount = results.size() - okCount;

        if (mr != null) {
            mr.counter("ai_comfort_item_results_total", "outcome", "ok").increment(okCount);
            mr.counter("ai_comfort_item_results_total", "outcome", "error").increment(errCount);
        }

        // 에러 샘플 3개만
        String errSamples = results.stream()
                .filter(r -> r.error != null || !isFinite(r.comfortScore))
                .limit(3)
                .map(r -> "itemId=" + r.itemId + ",err=" + trim(r.error, 120) + ",score=" + r.comfortScore)
                .collect(Collectors.joining(" | "));

        log.info("[AI_COMFORT_BATCH] category={} total={} ok={} err={} latencyMs={} errSamples={}",
                category, results.size(), okCount, errCount, latencyMs, (errSamples.isBlank() ? "-" : errSamples));

        // 6) scoreMap 구성 (성공 + finite만)
        Map<Long, Double> scoreMap = results.stream()
                .filter(r -> r.error == null)
                .filter(r -> isFinite(r.comfortScore))
                .collect(Collectors.toMap(r -> r.itemId, r -> r.comfortScore));

        // 7) TopK 선별 (score 있는 것 우선, 부족하면 score 없는 아이템으로 채움)
        List<ScoredItem> scored = new ArrayList<>();
        for (ClothingItem it : filtered) {
            Double s = scoreMap.get(it.getId());
            if (s != null) scored.add(new ScoredItem(it, s));
        }
        scored.sort(Comparator.comparing(ScoredItem::score).reversed());

        List<ClothingItem> picked = new ArrayList<>();

        for (ScoredItem si : scored) {
            if (picked.size() >= TOP_K) break;
            picked.add(si.item());
        }

        // 부족하면(부분 실패/score 없는 케이스) 남은 후보로 채움
        if (picked.size() < TOP_K) {
            Set<Long> pickedIds = picked.stream().map(ClothingItem::getId).collect(Collectors.toSet());
            for (ClothingItem it : filtered) {
                if (picked.size() >= TOP_K) break;
                if (pickedIds.contains(it.getId())) continue;
                picked.add(it);
            }
        }

        // 그래도 부족하면 ordered(완화)에서 채움
        if (picked.size() < TOP_K) {
            Set<Long> pickedIds = picked.stream().map(ClothingItem::getId).collect(Collectors.toSet());
            for (ClothingItem it : ordered) {
                if (picked.size() >= TOP_K) break;
                if (pickedIds.contains(it.getId())) continue;
                picked.add(it);
            }
        }

        // 로그(DB 이벤트) — enum 변경 없이 payload에 통계 포함
        safeLog(
                RecommendationEventType.RECO_GENERATED,
                """
                        {"category":"%s","region":"%s","lat":%f,"lon":%f,"candidateLimit":%d,"temp":%d,"zone":"%s","filteredSize":%d,
                         "aiTotal":%d,"aiOk":%d,"aiErr":%d,"latencyMs":%d,"pickedSize":%d}
                        """.formatted(category, region, lat, lon, candidateLimit, ctx.avgTemp(), ctx.zone(), filtered.size(),
                        results.size(), okCount, errCount, latencyMs, picked.size())
        );

        return picked.stream()
                .limit(TOP_K)
                .map(ClothingItemResponseDto::from)
                .toList();
    }

    private record ScoredItem(ClothingItem item, double score) {
    }

    private String trim(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}