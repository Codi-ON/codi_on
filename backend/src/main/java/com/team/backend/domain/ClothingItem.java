package com.team.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "clothing_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ClothingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: 나중에 User 엔티티 생기면 @ManyToOne으로 교체
    private Long clothingId;   // ML 등 외부 시스템과 매칭용 ID

    // 옷 이름 (UI에 띄워도 되고, 안 써도 됨)
    @Column(nullable = false)
    private String name;

    // 상의/하의/아우터/원피스...
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClothingCategory category;

    // 두께 (얇음 / 중간 / 두꺼움)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ThicknessLevel thicknessLevel;

    // ✅ 이 옷이 어울리는 계절 태그 (복수 선택 가능)
    //    ex) 여름 반팔 -> {SUMMER}
    //        간절기 가디건 -> {SPRING, FALL}
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "clothing_item_season",
            joinColumns = @JoinColumn(name = "clothing_item_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "season", length = 10)
    @Builder.Default
    private Set<SeasonType> seasons = new HashSet<>();

    // ===== 소재 비율 =====
    @Column
    private Integer cottonPercentage;

    @Column
    private Integer polyesterPercentage;

    @Column
    private Integer etcFiberPercentage;

    // ===== 날씨/온도 관련 =====
    @Column
    private Integer suitableMinTemp;   // null 이면 제한 없음

    @Column
    private Integer suitableMaxTemp;   // null 이면 제한 없음

    // ===== 부가 정보 (UI/추천용 메타데이터) =====
    @Column(length = 30)
    private String color;

    @Column(length = 50)
    private String styleTag;

    @Column(length = 255)
    private String imageUrl;

    @Builder.Default
    @Column(nullable = false)
    private Integer selectedCount = 0;

    public void increaseSelectedCount() {
        this.selectedCount++;
    }
}