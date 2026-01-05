package com.team.backend.domain.enums.feadback;

public enum FeedbackRating {
    GOOD(1),
    UNKNOWN(0),
    BAD(-1);

    private final int score;

    FeedbackRating(int score) {
        this.score = score;
    }

    public int toScore() {
        return score;
    }

    public static FeedbackRating fromScore(int score) {
        return switch (score) {
            case 1 -> GOOD;
            case 0 -> UNKNOWN;
            case -1 -> BAD;
            default -> throw new IllegalArgumentException("Invalid feedback_rating: " + score);
        };
    }
}