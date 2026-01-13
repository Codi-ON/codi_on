// src/main/java/com/team/backend/api/controller/recommendation/TodayRecommendationController.java
package com.team.backend.api.controller.recommendation;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.api.dto.recommendation.TodayOutfitFeedbackRequestDto;
import com.team.backend.api.dto.recommendation.TodayRecommendationResponseDto;
import com.team.backend.api.dto.recommendation.TodaySelectRequestDto;
import com.team.backend.domain.enums.recommendation.RecommendationModelType;
import com.team.backend.service.log.RecommendationEventLogService;
import com.team.backend.service.outfit.OutfitService;
import com.team.backend.service.recommendation.ClothingRecommendationService;
import com.team.backend.service.session.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recommendations")
public class TodayRecommendationController {

    private static final String SESSION_HEADER = "X-Session-Key";

    private static final String REGION = "Seoul";
    private static final double SEOUL_LAT = 37.5665;
    private static final double SEOUL_LON = 126.9780;

    private static final String EVT_RECO_ITEM_SELECTED = "RECO_ITEM_SELECTED";
    private static final String EVT_OUTFIT_TEMP_FEEDBACK = "OUTFIT_TEMP_FEEDBACK_SUBMITTED";

    private final SessionService sessionService;
    private final ClothingRecommendationService recommendationService;
    private final RecommendationEventLogService recoLogService;

    private final OutfitService outfitService;

    /**
     * GET /api/recommendations/today
     * 추천 후보 목록(아이템 ID 리스트) + recommendationId 반환
     */
    @GetMapping("/today")
    public ApiResponse<TodayRecommendationResponseDto> recommendToday(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @RequestParam(defaultValue = "10") int limit
    ) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        UUID recoId = UUID.randomUUID();

        List<ClothingItemResponseDto> items =
                recommendationService.recommendToday(REGION, SEOUL_LAT, SEOUL_LON, limit, key);

        List<Long> itemIds = (items == null) ? List.of()
                : items.stream().map(ClothingItemResponseDto::getClothingId).toList();

        return ApiResponse.success(
                TodayRecommendationResponseDto.builder()
                        .recommendationId(recoId.toString())
                        .itemIds(itemIds)
                        .build()
        );
    }

    /**
     * POST /api/recommendations/today/select
     * 1) 로그 저장
     * 2) outfits 저장까지 처리(SSOT: /api/outfits)
     * 응답: OutfitResponseDto.Today (캘린더 shape)
     */
    @PostMapping("/today/select")
    public ApiResponse<OutfitResponseDto.Today> selectTodayItem(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @RequestBody @Valid TodaySelectRequestDto req
    ) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        // 1) 로그 저장
        Map<String, Object> payload = new LinkedHashMap<>();

        List<Long> ids = req.getSelectedItems().stream()
                .map(TodaySelectRequestDto.SelectedItemDto::getClothingId)
                .toList();
        payload.put("clothingIds", ids);

        if (req.getModelType() != null && !req.getModelType().isBlank()) {
            payload.put("modelType", req.getModelType());
        }

        recoLogService.write(RecommendationEventLogRequestDto.builder()
                .sessionKey(key)
                .recommendationId(req.getRecommendationId())
                .eventType(EVT_RECO_ITEM_SELECTED)
                .funnelStep("SELECT")
                .payload(payload)
                .build());

        // 2) outfits 저장
        RecommendationModelType model = parseModelTypeOrNull(req.getModelType());

        List<OutfitRequestDto.Item> outfitItems = buildOutfitItems(req);
        OutfitRequestDto.SaveToday saveReq = OutfitRequestDto.SaveToday.builder()
                .items(outfitItems)
                .recoStrategy(model) // null 허용
                .build();

        OutfitResponseDto.Today saved = outfitService.saveToday(key, saveReq);

        return ApiResponse.success(saved);
    }

    /**
     * POST /api/recommendations/today/feedback
     * - 이건 "캘린더"가 아니라 ML/로그용(임시 피드백)
     */
    @PostMapping("/today/feedback")
    public ApiResponse<Void> submitTodayFeedback(
            @RequestHeader(SESSION_HEADER) String sessionKey,
            @RequestBody @Valid TodayOutfitFeedbackRequestDto req
    ) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        var f = req.getTempFeedback();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tempFeedback", f.name());
        payload.put("directionScore", f.toDirectionScore());
        payload.put("satisfactionScore", f.toSatisfactionScore());

        recoLogService.write(RecommendationEventLogRequestDto.builder()
                .sessionKey(key)
                .recommendationId(req.getRecommendationId())
                .eventType(EVT_OUTFIT_TEMP_FEEDBACK)
                .funnelStep("FEEDBACK")
                .payload(payload)
                .build());

        return ApiResponse.success(null);
    }

    private RecommendationModelType parseModelTypeOrNull(String modelType) {
        if (modelType == null || modelType.isBlank()) return null;
        try {
            return RecommendationModelType.valueOf(modelType.trim());
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * TodaySelectRequestDto에 sortOrder가 없으면 "요청 순서대로 1..N" 부여
     */
    private List<OutfitRequestDto.Item> buildOutfitItems(TodaySelectRequestDto req) {
        var selected = req.getSelectedItems();
        if (selected == null || selected.isEmpty()) {
            throw new IllegalArgumentException("selectedItems is required");
        }

        int[] idx = {0};
        return selected.stream()
                .map(s -> OutfitRequestDto.Item.builder()
                        .clothingId(s.getClothingId())
                        .sortOrder(++idx[0])
                        .build())
                .toList();
    }
}