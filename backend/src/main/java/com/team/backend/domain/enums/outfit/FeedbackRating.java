// src/main/java/com/team/backend/domain/enums/outfit/FeedbackRating.java
package com.team.backend.domain.enums.outfit;

public enum FeedbackRating {
    GOOD,
    UNKNOWN,
    BAD;

    public int toScore() {
        return switch (this) {
            case GOOD -> 1;
            case UNKNOWN -> 0;
            case BAD -> -1;
        };
    }

    public static FeedbackRating fromScore(Integer score) {
        if (score == null) return null;
        return switch (score) {
            case 1 -> GOOD;
            case 0 -> UNKNOWN;
            case -1 -> BAD;
            default -> throw new IllegalArgumentException("rating은 -1/0/1 만 허용됩니다.");
        };
    }
}