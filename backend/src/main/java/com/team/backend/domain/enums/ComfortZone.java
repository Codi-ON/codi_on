// domain/ComfortZone.java
package com.team.backend.domain.enums;

import com.team.backend.domain.ClothingItem;
import lombok.Getter;

import java.util.EnumSet;
import java.util.Set;

import static com.team.backend.domain.enums.ClothingCategory.OUTER;
import static com.team.backend.domain.enums.ThicknessLevel.NORMAL;
import static com.team.backend.domain.enums.ThicknessLevel.THICK;
import static com.team.backend.domain.enums.ThicknessLevel.THIN;

@Getter
public enum ComfortZone {

    // 온도 범위 + 허용 두께 + 아우터 허용 여부

    /**
     * 매우 추움: 영하 ~ 5도
     * - 두꺼운/중간 두께 허용
     * - OUTER(패딩, 코트 등) 강력 추천 구간
     */
    VERY_COLD(Integer.MIN_VALUE, 5,
            EnumSet.of(THICK, NORMAL),
            true
    ),

    /**
     * 추움: 6 ~ 12도
     * - THICK / MEDIUM 추천
     * - 아우터 계속 허용
     */
    COLD(6, 12,
            EnumSet.of(THICK, NORMAL),
            true
    ),

    /**
     * 선선함: 13 ~ 17도
     * - MEDIUM / THIN
     * - 얇은 아우터까지 허용
     */
    MILD(13, 17,
            EnumSet.of(NORMAL, THIN),
            true
    ),

    /**
     * 따뜻함: 18 ~ 22도
     * - MEDIUM / THIN
     * - 아우터는 대부분 비추천
     */
    WARM(18, 22,
            EnumSet.of(NORMAL, THIN),
            false
    ),

    /**
     * 더움: 23도 이상
     * - THIN 만
     * - 아우터 완전 X
     */
    HOT(23, Integer.MAX_VALUE,
            EnumSet.of(THIN),
            false
    );

    private final int minTemp;
    private final int maxTemp;
    private final Set<ThicknessLevel> allowedThickness;
    private final boolean outerAllowed;

    ComfortZone(int minTemp,
                int maxTemp,
                Set<ThicknessLevel> allowedThickness,
                boolean outerAllowed) {
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.allowedThickness = allowedThickness;
        this.outerAllowed = outerAllowed;
    }

    /**
     * 정수 온도 기준으로 ComfortZone 계산
     */
    public static ComfortZone from(int temp) {
        for (ComfortZone zone : values()) {
            if (temp >= zone.minTemp && temp <= zone.maxTemp) {
                return zone;
            }
        }
        // 이론상 안 오지만, 방어적으로
        return MILD;
    }

    /**
     * 실수 온도(평균 온도 double)도 바로 받을 수 있게 오버로드
     */
    public static ComfortZone from(double temp) {
        int rounded = (int) Math.round(temp);
        return from(rounded);
    }

    /**
     * 이 구간에서 이 옷을 추천해도 되는지 여부
     * - 두께 룰
     * - 아우터 허용 여부
     * - 옷 개별 온도 범위 (suitableMinTemp / suitableMaxTemp)와의 구간 겹침 체크
     */
    public boolean matches(ClothingItem item) {

        // 1) 두께 룰
        if (!allowedThickness.contains(item.getThicknessLevel())) {
            return false;
        }

        // 2) 아우터 룰
        if (!outerAllowed && item.getCategory() == OUTER) {
            return false;
        }

        // 3) 매우 추운 구간에서 아우터도 아니고 얇은 옷은 막기
        if (this == VERY_COLD &&
                item.getCategory() != OUTER &&
                item.getThicknessLevel() == THIN) {
            return false;
        }

        // 4) 옷 고유 온도 범위와의 겹침 체크 (옵셔널)
        //    - 옷에 suitableMinTemp / suitableMaxTemp 가 설정되어 있다면,
        //      ComfortZone 온도 구간과 전혀 겹치지 않으면 제외.
        Integer itemMin = item.getSuitableMinTemp();
        Integer itemMax = item.getSuitableMaxTemp();

        if (itemMin != null && this.maxTemp < itemMin) {
            // 존의 최대 온도가 옷의 최소 적정 온도보다 낮으면 겹치지 않음
            return false;
        }
        if (itemMax != null && this.minTemp > itemMax) {
            // 존의 최소 온도가 옷의 최대 적정 온도보다 높으면 겹치지 않음
            return false;
        }

        return true;
    }
}