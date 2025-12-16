// src/main/java/com/team/backend/domain/ClothingItem.java
package com.team.backend.domain;

import com.team.backend.domain.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "clothing_item",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_clothing_item_clothing_id", columnNames = "clothing_id")
        },
        indexes = {
                @Index(name = "idx_clothing_item_category", columnList = "category"),
                @Index(name = "idx_clothing_item_thickness", columnList = "thickness_level"),
                @Index(name = "idx_clothing_item_usage", columnList = "usage_type"),
                @Index(name = "idx_clothing_item_temp_range", columnList = "suitable_min_temp, suitable_max_temp"),
                @Index(name = "idx_clothing_item_selected", columnList = "selected_count")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ClothingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 외부(ML/프론트)에서 사용하는 비즈니스 ID
    @Column(name = "clothing_id", nullable = false)
    private Long clothingId;

    @Column(nullable = false, length = 60)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClothingCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "thickness_level", nullable = false, length = 10)
    private ThicknessLevel thicknessLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "usage_type", nullable = false, length = 10)
    private UsageType usageType;

    @Column(name = "suitable_min_temp", nullable = false)
    private Integer suitableMinTemp;

    @Column(name = "suitable_max_temp", nullable = false)
    private Integer suitableMaxTemp;

    // ===== (선택) 소재 비율: 없으면 null =====
    @Column(name = "cotton_percentage")
    private Integer cottonPercentage;

    @Column(name = "polyester_percentage")
    private Integer polyesterPercentage;

    @Column(name = "etc_fiber_percentage")
    private Integer etcFiberPercentage;

    // ===== 계절 태그(정규화: ElementCollection) =====
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "clothing_item_season",
            joinColumns = @JoinColumn(
                    name = "clothing_item_id",
                    foreignKey = @ForeignKey(name = "fk_clothing_item_season_item")
            )
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "season", nullable = false, length = 10)
    @Builder.Default
    private Set<SeasonType> seasons = new HashSet<>();

    // ===== 메타 =====
    @Column(length = 30)
    private String color;

    @Column(name = "style_tag", length = 50)
    private String styleTag;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "selected_count", nullable = false)
    @Builder.Default
    private Integer selectedCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.selectedCount == null) this.selectedCount = 0;
        if (this.seasons == null) this.seasons = new HashSet<>();
        validateRequired();
        validateTempRange();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        validateRequired();
        validateTempRange();
    }

    // ==============================
    // Domain methods (실무형 업데이트)
    // ==============================
    public void increaseSelectedCount() {
        this.selectedCount = (this.selectedCount == null ? 0 : this.selectedCount) + 1;
    }

    // PATCH: null이면 유지
    public void updateCore(String name,
                           ClothingCategory category,
                           ThicknessLevel thicknessLevel,
                           UsageType usageType) {
        if (name != null) {
            if (name.isBlank()) throw new IllegalArgumentException("name은 빈 값일 수 없습니다.");
            this.name = name;
        }
        if (category != null) this.category = category;
        if (thicknessLevel != null) this.thicknessLevel = thicknessLevel;
        if (usageType != null) this.usageType = usageType;
    }

    // PATCH: 온도 범위는 둘 중 하나만 와도 반영
    public void updateTempRange(Integer min, Integer max) {
        if (min != null) this.suitableMinTemp = min;
        if (max != null) this.suitableMaxTemp = max;
        validateTempRange();
    }

    // PATCH: 소재는 선택(없으면 null 유지, 들어오면 갱신)
    public void updateMaterials(Integer cotton, Integer polyester, Integer etc) {
        if (cotton != null) this.cottonPercentage = cotton;
        if (polyester != null) this.polyesterPercentage = polyester;
        if (etc != null) this.etcFiberPercentage = etc;
    }

    public void updateMeta(String color, String styleTag, String imageUrl) {
        if (color != null) this.color = color;
        if (styleTag != null) this.styleTag = styleTag;
        if (imageUrl != null) this.imageUrl = imageUrl;
    }

    // 시즌은 멀티선택 → 전체 교체 전략
    public void replaceSeasons(Set<SeasonType> newSeasons) {
        this.seasons.clear();
        if (newSeasons != null) this.seasons.addAll(newSeasons);
    }

    public boolean isSuitableForTemp(int temp) {
        return temp >= this.suitableMinTemp && temp <= this.suitableMaxTemp;
    }

    private void validateRequired() {
        if (clothingId == null) throw new IllegalArgumentException("clothingId는 필수입니다.");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("name은 필수입니다.");
        if (category == null) throw new IllegalArgumentException("category는 필수입니다.");
        if (thicknessLevel == null) throw new IllegalArgumentException("thicknessLevel은 필수입니다.");
        if (usageType == null) throw new IllegalArgumentException("usageType은 필수입니다.");
        if (suitableMinTemp == null || suitableMaxTemp == null) {
            throw new IllegalArgumentException("suitableMinTemp/suitableMaxTemp는 필수입니다.");
        }
    }

    private void validateTempRange() {
        if (suitableMinTemp != null && suitableMaxTemp != null && suitableMinTemp > suitableMaxTemp) {
            throw new IllegalArgumentException("suitableMinTemp는 suitableMaxTemp보다 클 수 없습니다.");
        }
    }
}