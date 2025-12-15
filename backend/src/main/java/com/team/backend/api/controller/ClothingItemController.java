package com.team.backend.api.controller;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.domain.ClothingCategory;
import com.team.backend.domain.ClothingItem;
import com.team.backend.repository.ClothingItemRepository;
import com.team.backend.service.ClothingItemService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clothes")
@RequiredArgsConstructor
public class ClothingItemController {

    public static final String API_PREFIX = "/api/clothes";
    private final ClothingItemRepository clothingItemRepository;

    private final ClothingItemService clothingItemService;

    // ==============================
    // 1) 현재 기온 / 카테고리 기준 추천
    // ==============================

    /**
     * 옷 추천 API
     * 예)
     *  - GET /api/clothes/recommend?temp=10
     *  - GET /api/clothes/recommend?temp=10&category=TOP
     */
    @GetMapping("/recommend")
    public ApiResponse<List<ClothingItem>> recommendClothes(
            @RequestParam(name = "temp") Integer temp,
            @RequestParam(name = "category", required = false) ClothingCategory category
    ) {
        if (category == null) {
            // 카테고리 없이, 기온만으로 추천
            List<ClothingItem> items = clothingItemService.recommendByTemperature(temp);
            return ApiResponse.success(items);
        } else {
            // 카테고리 + 기온 기준 추천
            List<ClothingItem> items =
                    clothingItemService.recommendByCategoryAndTemperature(category, temp);
            return ApiResponse.success(items);
        }
    }

    // ==============================
    // 2) 인기순 조회
    // ==============================

    /**
     * 전체 인기 옷 TOP N
     * 예)
     *  - GET /api/clothes/popular         (기본 10개)
     *  - GET /api/clothes/popular?limit=5 (상위 5개)
     */
    @GetMapping("/popular")
    public ApiResponse<List<ClothingItem>> getPopularClothes(
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        List<ClothingItem> items = clothingItemService.getTopPopularItems(limit);
        return ApiResponse.success(items);
    }

    /**
     * 카테고리별 인기 TOP N
     * 예)
     *  - GET /api/clothes/popular/by-category?category=TOP
     *  - GET /api/clothes/popular/by-category?category=OUTER&limit=5
     */
    @GetMapping("/popular/by-category")
    public ApiResponse<List<ClothingItem>> getPopularClothesByCategory(
            @RequestParam(name = "category") ClothingCategory category,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        List<ClothingItem> items =
                clothingItemService.getTopPopularItemsByCategory(category, limit);
        return ApiResponse.success(items);
    }

    // ==============================
    // 3) 선택 횟수 증가 (선호도 카운팅)
    // ==============================

    /**
     * 사용자가 실제로 이 옷을 선택했을 때 호출
     * 예)
     *  - POST /api/clothes/123/select
     */
    @PostMapping("/{id}/select")
    public ApiResponse<Void> selectClothing(@PathVariable("id") Long id) {
        clothingItemService.markSelected(id);
        return ApiResponse.success("선택 횟수가 증가되었습니다.", null);
    }

    // ==============================
    // 4) 기본 조회 (옵션)
    // ==============================

    /**
     * 단건 조회 (디버깅 / 어드민용)
     *  - GET /api/clothes/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<ClothingItem> getClothingById(@PathVariable("id") Long id) {
        ClothingItem item = clothingItemService.getById(id);
        return ApiResponse.success(item);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteClothingItem(Long id) {
        ClothingItem item = clothingItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "삭제할 옷을 찾을 수 없습니다. id=" + id
                ));

        clothingItemRepository.delete(item);
    }
}