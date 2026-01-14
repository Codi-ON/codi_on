// src/main/java/com/team/backend/domain/enums/recommendation/RecommendationEventType.java
package com.team.backend.domain.enums.recommendation;

public enum RecommendationEventType {
    CANDIDATES_CREATED,
    CHECKLIST_SUBMITTED,
    RECO_GENERATED,
    RECO_SHOWN,
    RECO_ITEM_SELECTED,
    RECO_FEEDBACK_SUBMITTED,
    RECO_OUTFIT_TEMP_FEEDBACK_SUBMITTED,
    RECO_COMPLETED,
    RECO_ERROR,
    FEEDBACK_ADAPTIVE_REQUESTED,
    FEEDBACK_ADAPTIVE_SUCCEEDED,
    FEEDBACK_ADAPTIVE_FAILED

}