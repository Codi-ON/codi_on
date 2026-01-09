// src/main/java/com/team/backend/service/outfit/OutfitService.java
package com.team.backend.service.outfit;

import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.domain.enums.feadback.FeedbackRating;
import com.team.backend.domain.enums.recommendation.RecommendationModelType;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import com.team.backend.repository.outfit.OutfitHistoryRepository;
import com.team.backend.service.session.SessionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OutfitService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final OutfitHistoryRepository outfitHistoryRepository;
    private final SessionService sessionService;

    // =========================
    // SAVE : 오늘 아웃핏 저장
    // =========================
    @Transactional
    public OutfitResponseDto.Today saveToday(String sessionKey, OutfitRequestDto.SaveToday req) {
        String key = sessionService.validateOnly(sessionKey);
        LocalDate today = LocalDate.now(KST);

        if (req == null) throw new IllegalArgumentException("request body is required");

        List<OutfitRequestDto.Item> cleaned = normalizeItems(req.getItems());

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDateWithItems(key, today)
                .orElseGet(() -> OutfitHistory.builder()
                        .sessionKey(key)
                        .outfitDate(today)
                        .build()
                );

        // 전략 저장 (null 허용)
        RecommendationModelType reco = req.getRecoStrategy();
        history.setRecoStrategy(reco);

        // 오늘 아웃핏을 다시 저장하면 기존 피드백은 무효 처리하는 게 안전
        history.resetFeedback();

        // 아이템 교체 (orphanRemoval + cascade)
        List<OutfitHistoryItem> newItems = new ArrayList<>(cleaned.size());
        for (OutfitRequestDto.Item it : cleaned) {
            newItems.add(OutfitHistoryItem.of(history, it.getClothingId(), it.getSortOrder()));
        }
        history.replaceItems(newItems);

        OutfitHistory saved = outfitHistoryRepository.save(history);
        // LAZY 방지용 (응답 만들 때 items 접근)
        saved.getItems().size();

        return OutfitResponseDto.Today.from(saved);
    }

    // =========================
    // READ : 오늘 아웃핏 조회
    // =========================
    @Transactional(readOnly = true)
    public OutfitResponseDto.Today getToday(String sessionKey) {
        String key = sessionService.validateOnly(sessionKey);
        LocalDate today = LocalDate.now(KST);

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDateWithItems(key, today)
                .orElseThrow(() -> new EntityNotFoundException("오늘 저장한 착장이 없습니다. date=" + today));

        // LAZY 방지
        history.getItems().size();

        return OutfitResponseDto.Today.from(history);
    }

    // =========================
    // READ : 월간 히스토리 조회
    // =========================
    @Transactional(readOnly = true)
    public OutfitResponseDto.MonthlyHistory getMonthlyHistory(String sessionKey, int year, int month) {
        String key = sessionService.validateOnly(sessionKey);

        if (year < 2000 || year > 2100) throw new IllegalArgumentException("year is invalid");
        if (month < 1 || month > 12) throw new IllegalArgumentException("month is invalid");

        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate toExclusive = ym.plusMonths(1).atDay(1);

        List<OutfitHistory> rows = outfitHistoryRepository.findMonthlyWithItems(key, from, toExclusive);
        return OutfitResponseDto.MonthlyHistory.of(ym, rows);
    }

    // =========================
    // FEEDBACK : 날짜 지정 1회 제출
    // =========================
    @Transactional
    public OutfitResponseDto.Today submitFeedbackOnce(String sessionKey, LocalDate date, Integer ratingInt) {
        String key = sessionService.validateOnly(sessionKey);
        if (date == null) throw new IllegalArgumentException("date is required");

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDateWithItems(key, date)
                .orElseThrow(() -> new EntityNotFoundException("해당 날짜에 저장한 착장이 없습니다. date=" + date));

        FeedbackRating rating = toFeedbackRating(ratingInt);
        history.submitFeedbackOnce(rating);

        OutfitHistory saved = outfitHistoryRepository.save(history);
        saved.getItems().size();

        return OutfitResponseDto.Today.from(saved);
    }

    @Transactional
    public OutfitResponseDto.Today submitTodayFeedback(String sessionKey, Integer ratingInt) {
        LocalDate today = LocalDate.now(KST);
        return submitFeedbackOnce(sessionKey, today, ratingInt);
    }

    // =========================
    // helpers
    // =========================
    private FeedbackRating toFeedbackRating(Integer ratingInt) {
        if (ratingInt == null) throw new IllegalArgumentException("rating is required");
        return switch (ratingInt) {
            case 1 -> FeedbackRating.BAD;
            case 2 -> FeedbackRating.UNKNOWN;
            case 3 -> FeedbackRating.GOOD;
            default -> throw new IllegalArgumentException("rating은 1~3만 허용됩니다.");
        };
    }

    /**
     * 정책(너가 지금 쓰는 UI/학습 목적 기준):
     * - items는 2~3개
     * - sortOrder는 1/2/3만 허용, 중복 금지
     * - 1(top), 2(bottom)은 필수 (학습/분석 기준점)
     * - clothingId 중복 금지(학습 데이터 오염)
     */
    private List<OutfitRequestDto.Item> normalizeItems(List<OutfitRequestDto.Item> items) {
        if (items == null) throw new IllegalArgumentException("items is required");

        List<OutfitRequestDto.Item> cleaned = new ArrayList<>();
        for (OutfitRequestDto.Item it : items) {
            if (it == null) continue;
            if (it.getClothingId() == null) throw new IllegalArgumentException("clothingId is required");
            if (it.getSortOrder() == null) throw new IllegalArgumentException("sortOrder is required");
            cleaned.add(it);
        }

        if (cleaned.size() < 2) throw new IllegalArgumentException("items는 최소 2개가 필요합니다.");
        if (cleaned.size() > 3) throw new IllegalArgumentException("items는 최대 3개까지만 허용됩니다.");

        cleaned.sort(Comparator.comparing(OutfitRequestDto.Item::getSortOrder));

        Set<Integer> allowed = Set.of(1, 2, 3);
        Set<Integer> used = new HashSet<>();
        for (OutfitRequestDto.Item it : cleaned) {
            int so = it.getSortOrder();
            if (!allowed.contains(so)) throw new IllegalArgumentException("sortOrder는 1/2/3만 허용됩니다.");
            if (!used.add(so)) throw new IllegalArgumentException("sortOrder 중복은 허용되지 않습니다.");
        }
        if (!used.contains(1) || !used.contains(2)) {
            throw new IllegalArgumentException("sortOrder 1(top), 2(bottom)은 필수입니다.");
        }

        Set<Long> uniqClothing = new HashSet<>();
        for (OutfitRequestDto.Item it : cleaned) {
            if (!uniqClothing.add(it.getClothingId())) {
                throw new IllegalArgumentException("clothingId 중복은 허용되지 않습니다.");
            }
        }

        return cleaned;
    }
}