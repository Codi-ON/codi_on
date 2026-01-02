package com.team.backend.service.recommendation;

import com.team.backend.api.dto.recommendation.RecommendationEventLogRequestDto;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.service.ai.RecommendationAiClient; // <- 실제 클래스명에 맞춰
import com.team.backend.service.ai.dto.RecommendationAiDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

// 임시추가
import com.team.backend.api.dto.weather.DailyWeatherResponseDto;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.service.weather.WeatherService;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import java.util.stream.Collectors;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClothingRecommendationService {

    private static final int TOP_K = 3;

    private final RecommendationAiClient recommendationAiClient; // <- 실제 빈 이름에 맞춰
    private final RecommendationEventLogService recommendationEventLogService;

    // 임시추가
    private final WeatherService weatherService;

    public RecommendationAiDto.RecommendationResponse recommendByMaterialML(
            RecommendationAiDto.RecommendationRequest req
    ) {
        long startedAt = System.currentTimeMillis();

        // 0) 최소 방어 (절대 500 방지)
        if (req == null) return fallbackEmpty("req_null");
        if (req.weather == null) return fallbackEmpty("weather_null");
        if (req.items == null || req.items.isEmpty()) return fallbackEmpty("items_empty");

        try {
            // 1) AI 호출
            RecommendationAiDto.RecommendationResponse res = recommendationAiClient.recommend(req);

            if (res == null) {
                logEvent(RecommendationEventType.RECO_ERROR, Map.of(
                        "type", "MATERIAL_AI_NULL_RESPONSE",
                        "latencyMs", System.currentTimeMillis() - startedAt
                ));
                return fallbackTopK(req, "ai_null_response");
            }

            List<RecommendationAiDto.Recommendation> recs =
                    (res.recommendations == null) ? List.of() : res.recommendations;

            // 2) 응답 정리 (clothingId 필수, score NaN 방지)
            List<RecommendationAiDto.Recommendation> cleaned = new ArrayList<>();
            for (RecommendationAiDto.Recommendation r : recs) {
                if (r == null) continue;
                if (r.clothingId == null) continue;
                if (r.score != null && !Double.isFinite(r.score)) continue;
                cleaned.add(r);
            }

            // score desc, null은 뒤로
            cleaned.sort((a, b) -> {
                Double sa = a.score;
                Double sb = b.score;
                if (sa == null && sb == null) return 0;
                if (sa == null) return 1;
                if (sb == null) return -1;
                return Double.compare(sb, sa);
            });

            List<RecommendationAiDto.Recommendation> top =
                    cleaned.subList(0, Math.min(TOP_K, cleaned.size()));

            res.recommendations = top;

            logEvent(RecommendationEventType.RECO_GENERATED, new LinkedHashMap<String, Object>() {{
                put("type", "MATERIAL_AI_RECOMMEND");
                put("latencyMs", System.currentTimeMillis() - startedAt);
                put("reqItemCount", req.items.size());
                put("aiRecCount", recs.size());
                put("pickedCount", top.size());
            }});

            if (top.isEmpty()) return fallbackTopK(req, "ai_empty");

            return res;

        } catch (Exception e) {
            log.warn("[MATERIAL_AI_FAIL] {}", e.getMessage(), e);

            logEvent(RecommendationEventType.RECO_ERROR, Map.of(
                    "type", "MATERIAL_AI_EXCEPTION",
                    "latencyMs", System.currentTimeMillis() - startedAt,
                    "errorType", e.getClass().getSimpleName(),
                    "message", safeMsg(e)
            ));

            return fallbackTopK(req, "ai_exception");
        }
    }

    private RecommendationAiDto.RecommendationResponse fallbackTopK(
            RecommendationAiDto.RecommendationRequest req,
            String reason
    ) {
        List<RecommendationAiDto.Recommendation> out = new ArrayList<>();

        for (RecommendationAiDto.Item it : req.items) {
            if (it == null) continue;
            if (it.clothingId == null) continue;

            RecommendationAiDto.Recommendation r = new RecommendationAiDto.Recommendation();
            r.clothingId = it.clothingId;
            r.name = (it.name == null || it.name.isBlank()) ? "unknown" : it.name;
            r.score = null;
            r.analysis = "fallback: " + reason;
            out.add(r);

            if (out.size() >= TOP_K) break;
        }

        RecommendationAiDto.RecommendationResponse res = new RecommendationAiDto.RecommendationResponse();
        res.status = "fallback";
        res.message = reason;
        res.recommendations = out;
        return res;
    }

    private RecommendationAiDto.RecommendationResponse fallbackEmpty(String reason) {
        RecommendationAiDto.RecommendationResponse res = new RecommendationAiDto.RecommendationResponse();
        res.status = "fallback";
        res.message = reason;
        res.recommendations = List.of();
        return res;
    }

    private void logEvent(RecommendationEventType type, Map<String, Object> payload) {
        try {
            recommendationEventLogService.write(
                    RecommendationEventLogRequestDto.builder()
                            .eventType(type)
                            .sessionKey("SYSTEM") // TODO: 실제 sessionKey로 교체 권장
                            .payload(payload)
                            .build()
            );
        } catch (Exception ignore) {}
    }

    private String safeMsg(Exception e) {
        return (e.getMessage() == null) ? e.getClass().getSimpleName() : e.getMessage();
    }

    // ==========================================
    // [임시추가] Controller와의 연결을 위한 메서드
    // ==========================================
    public List<ClothingItemResponseDto> recommendToday(String region, double lat, double lon, int resolved) {
        log.info("Request recommendToday: region={}, lat={}, lon={}, resolved={}", region, lat, lon, resolved);

        // 1-1. 날씨 조회
        DailyWeatherResponseDto weatherDto = weatherService.getTodaySmart(lat, lon, region);

        // 1-2. AI용 날씨 객체 생성 (WeatherData)
        RecommendationAiDto.WeatherData aiWeather = new RecommendationAiDto.WeatherData();
        if (weatherDto != null) {
            aiWeather.temperature = weatherDto.getTemperature();
            aiWeather.feelsLikeTemperature = weatherDto.getFeelsLikeTemperature();
            aiWeather.humidity = weatherDto.getHumidity();
            aiWeather.precipitationProbability = weatherDto.getPrecipitationProbability();
        }

        // 1-3. 옷 목록 준비 (현재는 빈 리스트 -> 추후 DB 연동 필요)
        List<RecommendationAiDto.Item> itemsForAi = new ArrayList<>();

        // 1-4. AI 요청 객체 조립
        RecommendationAiDto.RecommendationRequest aiRequest = new RecommendationAiDto.RecommendationRequest();
        aiRequest.weather = aiWeather;
        aiRequest.items = itemsForAi;

        // 1-5. AI 추천 실행 (내부 메서드 호출)
        // [중요] aiResponse 변수 선언
        RecommendationAiDto.RecommendationResponse aiResponse = recommendByMaterialML(aiRequest);

        // 1-6. 결과 변환 (Recommendation -> ClothingItemResponseDto)
        if (aiResponse == null || aiResponse.recommendations == null) {
            return List.of();
        }

        return aiResponse.recommendations.stream()
                .map(this::convertToDto) // 아래 convertToDto 메서드 사용
                .collect(Collectors.toList());
    }

    // 카테고리별 추천 (현재는 위와 동일하게 처리)
    public List<ClothingItemResponseDto> recommendTodayByCategory(ClothingCategory category, String region, double lat, double lon, int resolved) {
        return recommendToday(region, lat, lon, resolved);
    }

    // [중요] DTO 변환 헬퍼 메서드 (이게 없어서 에러났었음)
    private ClothingItemResponseDto convertToDto(RecommendationAiDto.Recommendation r) {
        // ClothingItemResponseDto에 @Builder가 있다고 가정
        return ClothingItemResponseDto.builder()
                .id(r.clothingId)
                .name(r.name)
                // .category(...) // 필요시 추가
                // .imageUrl(...) // 필요시 추가
                .build();
    }
}