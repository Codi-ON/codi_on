
package com.team.backend.domain.outfit;
import com.team.backend.domain.enums.outfit.FeedbackRating;
import com.team.backend.domain.enums.outfit.FeedbackRatingConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "outfit_history")
public class OutfitHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_key", nullable = false)
    private String sessionKey;

    @Column(name = "outfit_date", nullable = false)
    private LocalDate outfitDate;

    @Convert(converter = FeedbackRatingConverter.class)
    @Column(name = "feedback_rating")
    private FeedbackRating feedbackRating;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "outfitHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OutfitHistoryItem> items = new ArrayList<>();

    public void replaceItems(List<OutfitHistoryItem> newItems, OffsetDateTime now) {
        this.items.clear();
        this.items.addAll(newItems);
        this.updatedAt = now;
        if (this.createdAt == null) this.createdAt = now;
    }

    // ✅ 정책: 덮어쓰기(saveToday) 시 피드백 초기화
    public void resetFeedback(OffsetDateTime now) {
        this.feedbackRating = null;
        this.updatedAt = now;
        if (this.createdAt == null) this.createdAt = now;
    }

    // ✅ 정책: 피드백 1회 제한
    public void submitFeedbackOnce(FeedbackRating rating, OffsetDateTime now) {
        if (rating == null) throw new IllegalArgumentException("rating is required");
        if (this.feedbackRating != null) throw new IllegalStateException("feedback already submitted");
        this.feedbackRating = rating;
        this.updatedAt = now;
        if (this.createdAt == null) this.createdAt = now;
    }
}