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
}