package com.team.backend.api.dto.user;


import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserDashboardRequest {
    /**
     * CLICK_ITEMS | FAVORITED_CLICK_ITEMS | CATEGORY_DONUT | OUTFITS_DAILY
     */
    private String section;

    /**
     * optional. 미지정 시 KST 기준 현재 년/월
     */
    private Integer year;
    private Integer month;
}