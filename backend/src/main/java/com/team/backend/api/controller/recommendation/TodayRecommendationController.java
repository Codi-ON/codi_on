// src/main/java/com/team/backend/api/controller/recommendation/RecommendationController.java
package com.team.backend.api.controller.recommendation;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.ClothingItemResponseDto;
import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.recommendation.TodayOutfitFeedbackRequestDto;
import com.team.backend.api.dto.recommendation.TodayRecommendationResponseDto;
import com.team.backend.api.dto.recommendation.TodaySelectRequestDto;
import com.team.backend.service.log.RecommendationEventLogService;
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

    // ✅ MVP: 서울 고정
    private static final String REGION = "Seoul";
    private static final double SEOUL_LAT = 37.5665;
    private static final double SEOUL_LON = 126.9780;

    // reco event_type (DB string 고정)
    private static final String EVT_RECO_ITEM_SELECTED = "RECO_ITEM_SELECTED";
    private static final String EVT_OUTFIT_TEMP_FEEDBACK = "OUTFIT_TEMP_FEEDBACK_SUBMITTED";

    private final SessionService sessionService;
    private final ClothingRecommendationService recommendationService;
    private final RecommendationEventLogService recoLogService;

    /**
     * GET /api/recommendations/today?limit=10
     * - 서울 고정
     */
    @GetMapping("/today")
    public ApiResponse<TodayRecommendationResponseDto> recommendToday(
            @RequestHeader("X-Session-Key") String sessionKey,
            @RequestParam(defaultValue = "10") int limit
    ) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        // v1: recoId 임시 생성(추후 체크리스트 submit에서 발급한 recoId로 교체)
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
     * - 추천 후보 중 "최종 선택" 전환 이벤트 (퍼널 핵심)
     */
    @PostMapping("/today/select")
    public ApiResponse<Void> selectTodayItem(
            @RequestHeader("X-Session-Key") String sessionKey,
            @RequestBody @Valid TodaySelectRequestDto req
    ) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        var payload = new java.util.LinkedHashMap<String, Object>();

        // ✅ 핵심: 리스트로 저장 (null-safe)
        var selectedItems = req.getSelectedItems();
        var ids = (selectedItems == null) ? java.util.List.<Long>of()
                : selectedItems.stream()
                .map(TodaySelectRequestDto.SelectedItemDto::getClothingId)
                .filter(java.util.Objects::nonNull)
                .toList();

        payload.put("clothingIds", ids);

        // 필요하면 원본도 같이 남길 수 있음(대시보드용은 보통 ids만으로 충분)
        // payload.put("selectedItems", selectedItems);

        // ✅ modelType 추가 (blank 방지)
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

        return ApiResponse.success("추천 선택 로그가 저장되었습니다.", null);
    }

    /**
     * POST /api/recommendations/today/feedback
     * - 오늘 착장 체감(HOT/OK/COLD/UNKNOWN) 피드백
     * - 대시보드 KPI/ML용 점수(direction/satisfaction) 함께 payload로 저장
     */
    @PostMapping("/today/feedback")
    public ApiResponse<Void> submitTodayFeedback(
            @RequestHeader("X-Session-Key") String sessionKey,
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

        return ApiResponse.success("착장 피드백이 저장되었습니다.", null);
    }
}