package com.team.backend.domain.enums.feadback;

public enum OutfitTempFeedback {
    HOT, OK, COLD, UNKNOWN;

    /**
     * 대시보드 KPI용 (만족/불만)
     * OK=+1, HOT/COLD=-1, UNKNOWN=null
     */
    public Integer toSatisfactionScore() {
        return switch (this) {
            case OK -> 1;
            case HOT, COLD -> -1;
            case UNKNOWN -> null;
        };
    }

    /**
     * ML/분석용 (온도 방향)
     * COLD=-1, OK=0, HOT=+1, UNKNOWN=null
     */
    public Integer toDirectionScore() {
        return switch (this) {
            case COLD -> -1;
            case OK -> 0;
            case HOT -> 1;
            case UNKNOWN -> null;
        };
    }
}