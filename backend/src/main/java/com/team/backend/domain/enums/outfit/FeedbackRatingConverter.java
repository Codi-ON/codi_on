package com.team.backend.domain.enums.outfit;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class FeedbackRatingConverter implements AttributeConverter<FeedbackRating, Integer> {

    @Override
    public Integer convertToDatabaseColumn(FeedbackRating attribute) {
        if (attribute == null) return null;
        return attribute.toScore();
    }

    @Override
    public FeedbackRating convertToEntityAttribute(Integer dbData) {
        if (dbData == null) return null;
        return switch (dbData) {
            case 1 -> FeedbackRating.GOOD;
            case 0 -> FeedbackRating.UNKNOWN;
            case -1 -> FeedbackRating.BAD;
            default -> throw new IllegalArgumentException("Invalid feedback_rating: " + dbData);
        };
    }
}