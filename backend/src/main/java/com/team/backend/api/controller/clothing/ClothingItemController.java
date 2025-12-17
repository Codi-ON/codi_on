// src/main/java/com/team/backend/api/controller/clothing/ClothingItemController.java
package com.team.backend.api.controller.clothing;

import com.team.backend.api.dto.ApiResponse;
import com.team.backend.api.dto.clothingItem.*;
import com.team.backend.domain.enums.ClothingCategory;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.service.clothing.ClothingItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clothes")
@RequiredArgsConstructor
public class ClothingItemController {

    private final ClothingItemService clothingItemService;
    private final ClothingItemRepository clothingItemRepository;


    // 1) Create
    @PostMapping
    public ApiResponse<ClothingItemResponseDto> create(@RequestBody @Valid ClothingItemCreateRequestDto req) {
         if (req == null) throw new IllegalArgumentException("요청 바디가 비었습니다.");

    if (req.getClothingId() == null) throw new IllegalArgumentException("clothingId는 필수입니다.");
    if (clothingItemRepository.existsByClothingId(req.getClothingId())) {
        throw new IllegalArgumentException("이미 존재하는 clothingId 입니다. clothingId=" + req.getClothingId());
    }
        return ApiResponse.success(clothingItemService.create(req));
    }

    // 2) Read
    @GetMapping("/{id}")
    public ApiResponse<ClothingItemResponseDto> getById(@PathVariable Long id) {
        return ApiResponse.success(clothingItemService.getById(id));
    }

    // 3) Update (PATCH)
    @PatchMapping("/{id}")
    public ApiResponse<ClothingItemResponseDto> update(
            @PathVariable Long id,
            @RequestBody ClothingItemUpdateRequestDto req
    ) {
        return ApiResponse.success(clothingItemService.update(id, req));
    }

    // 4) Delete
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        clothingItemService.delete(id);
        return ApiResponse.success("삭제 완료", null);
    }

    // 5) Search (필터/탐색: 프론트 클릭용)
    // - GET /api/clothes/search?temp=10&category=TOP&usageType=INDOOR&seasons=SUMMER&seasons=SPRING&sort=popular&limit=20
    // - (추가) GET /api/clothes/search?clothingId=123  <= 기존 /by-clothing-id/{clothingId} 대체
    @GetMapping("/search")

    public ApiResponse<List<ClothingItemResponseDto>> search(@ModelAttribute ClothingItemSearchRequestDto req) {

        return ApiResponse.success(clothingItemService.search(req));
    }

    // 6) Popular (통합)
    // - GET /api/clothes/popular?limit=10
    // - GET /api/clothes/popular?category=TOP&limit=10   <= 기존 /popular/by-category 대체
    @GetMapping("/popular")
    public ApiResponse<List<ClothingItemResponseDto>> popular(
            @RequestParam(required = false) ClothingCategory category,
            @RequestParam(defaultValue = "10") int limit
    ) {
        if (category == null) {
            return ApiResponse.success(clothingItemService.getPopular(limit));
        }
        return ApiResponse.success(clothingItemService.getPopularByCategory(category, limit));
    }

    // 7) Select count
    @PostMapping("/{id}/select")
    public ApiResponse<Void> select(@PathVariable Long id) {
        clothingItemService.markSelected(id);
        return ApiResponse.success("선택 횟수 증가", null);
    }
}