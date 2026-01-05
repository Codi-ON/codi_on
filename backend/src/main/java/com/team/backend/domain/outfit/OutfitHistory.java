package com.team.backend.domain.outfit;

import com.team.backend.domain.enums.feadback.FeedbackRating;
import com.team.backend.domain.enums.feadback.FeedbackRatingConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "outfit_history",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_outfit_history_session_date", columnNames = {"session_key", "outfit_date"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OutfitHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_key", nullable = false, length = 255)
    private String sessionKey;

    @Column(name = "outfit_date", nullable = false)
    private LocalDate outfitDate;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Convert(converter = FeedbackRatingConverter.class)
    @Column(name = "feedback_rating")
    private FeedbackRating feedbackRating;

    // ===== weather snapshot (outfit_history에 저장된 값만 신뢰) =====
    @Column(name = "weather_temp")
    private Double weatherTemp;

    @Column(name = "weather_condition", length = 32)
    private String weatherCondition;

    @Column(name = "weather_feels_like")
    private Double weatherFeelsLike;

    @Column(name = "weather_cloud_amount")
    private Integer weatherCloudAmount;

    @OneToMany(mappedBy = "outfitHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OutfitHistoryItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = (this.createdAt == null) ? now : this.createdAt;
        this.updatedAt = (this.updatedAt == null) ? now : this.updatedAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // ===== domain behaviors =====

    public void replaceItems(List<OutfitHistoryItem> newItems) {
        this.items.clear();
        if (newItems == null) return;
        this.items.addAll(newItems);
    }

    public void resetFeedback() {
        this.feedbackRating = null;
    }

    /**
     * 정책: 1회만 허용
     * - 이미 feedbackRating 있으면 IllegalStateException
     */
    public void submitFeedbackOnce(FeedbackRating rating) {
        if (rating == null) throw new IllegalArgumentException("rating is required");
        if (this.feedbackRating != null) {
            throw new IllegalStateException("feedback already submitted");
        }
        this.feedbackRating = rating;
    }

    public void applyWeatherSnapshot(Double temp, String condition, Double feelsLike, Integer cloudAmount) {
        this.weatherTemp = temp;
        this.weatherCondition = condition;
        this.weatherFeelsLike = feelsLike;
        this.weatherCloudAmount = cloudAmount;
    }
}