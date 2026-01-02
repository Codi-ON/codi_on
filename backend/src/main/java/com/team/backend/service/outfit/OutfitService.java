package com.team.backend.service.outfit;

import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.common.exception.ConflictException;
import com.team.backend.domain.enums.outfit.FeedbackRating;
import com.team.backend.domain.enums.session.SessionEventType;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import com.team.backend.repository.outfit.OutfitHistoryRepository;
import com.team.backend.service.session.SessionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class OutfitService {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final SessionService sessionService;
    private final OutfitHistoryRepository outfitHistoryRepository;
    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    // =========================
    // WRITE
    // =========================
    public OutfitResponseDto.Today saveToday(String sessionKey, OutfitRequestDto.SaveToday req) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        LocalDate today = LocalDate.now(KST);
        OffsetDateTime now = OffsetDateTime.now(KST);

        List<OutfitRequestDto.Item> normalized = normalizeItems(req == null ? null : req.getItems());
        List<Long> clothingIds = extractClothingIds(normalized);

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDate(key, today)
                .orElseGet(() -> OutfitHistory.builder()
                        .sessionKey(key)
                        .outfitDate(today)
                        .build()
                );

        List<OutfitHistoryItem> items = new ArrayList<>(normalized.size());
        for (int i = 0; i < normalized.size(); i++) {
            OutfitRequestDto.Item src = normalized.get(i);
            items.add(OutfitHistoryItem.builder()
                    .outfitHistory(history)
                    .clothingId(src.getClothingId())
                    .sortOrder(i + 1)
                    .build());
        }

        history.replaceItems(items, now);

        // ★ 1회 제한(신뢰성) 정책이면 resetFeedback 호출 금지
        // history.resetFeedback(now);

        OutfitHistory saved = outfitHistoryRepository.save(history);

        try {
            sessionLogJdbcRepository.insert(
                    SessionLogRequestDto.builder()
                            .userId(null)
                            .sessionKey(key)
                            .eventType(SessionEventType.OUTFIT_SAVED)
                            .payload(Map.of("clothingIds", clothingIds))
                            .build()
            );
        } catch (Exception ignored) {}

        return OutfitResponseDto.Today.from(saved);
    }

    // =========================
    // READ
    // =========================
    @Transactional(readOnly = true)
    public OutfitResponseDto.Today getToday(String sessionKey) {
        String key = sessionService.validateOnly(sessionKey);

        LocalDate today = LocalDate.now(KST);
        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDate(key, today)
                .orElseThrow(() -> new EntityNotFoundException("오늘 저장한 착장이 없습니다. date=" + today));

        history.getItems().size();
        return OutfitResponseDto.Today.from(history);
    }

    @Transactional(readOnly = true)
    public OutfitResponseDto.MonthlyHistory getMonthlyHistory(String sessionKey, int year, int month) {
        String key = sessionService.validateOnly(sessionKey);

        if (year < 2000 || year > 2100) throw new IllegalArgumentException("year is invalid");
        if (month < 1 || month > 12) throw new IllegalArgumentException("month is invalid");

        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate toExclusive = ym.plusMonths(1).atDay(1);

        List<OutfitHistory> rows = outfitHistoryRepository.findMonthlyWithItems(key, from, toExclusive);

        List<OutfitResponseDto.MonthlyDay> days = new ArrayList<>(rows.size());

        for (OutfitHistory h : rows) {
            List<OutfitHistoryItem> items = new ArrayList<>(h.getItems());
            items.sort(Comparator.comparing(OutfitHistoryItem::getSortOrder));

            List<OutfitResponseDto.MonthlyItem> dtoItems = new ArrayList<>(items.size());
            for (OutfitHistoryItem it : items) {
                dtoItems.add(OutfitResponseDto.MonthlyItem.builder()
                        .clothingId(it.getClothingId())
                        .sortOrder(it.getSortOrder())
                        .imageUrl(null)
                        .build());
            }

            Integer score = (h.getFeedbackRating() == null) ? null : h.getFeedbackRating().toScore();

            days.add(OutfitResponseDto.MonthlyDay.builder()
                    .date(h.getOutfitDate().toString())
                    .items(dtoItems)
                    .feedbackScore(score)
                    .weatherTemp(null)
                    .condition(null)
                    .build());
        }

        days.sort(Comparator.comparing(OutfitResponseDto.MonthlyDay::getDate));

        return OutfitResponseDto.MonthlyHistory.builder()
                .year(year)
                .month(month)
                .days(days)
                .build();
    }

    // =========================
    // FEEDBACK (1회 제한)
    // =========================
    public OutfitResponseDto.Today submitTodayFeedback(String sessionKey, Integer rating) {
        return submitFeedbackOnce(sessionKey, LocalDate.now(KST), rating);
    }

    public OutfitResponseDto.Today submitFeedbackOnce(String sessionKey, LocalDate date, Integer rating) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        // 미래 차단(정책)
        LocalDate today = LocalDate.now(KST);
        if (date.isAfter(today)) throw new ConflictException("미래 날짜에는 피드백을 남길 수 없습니다.");

        OffsetDateTime now = OffsetDateTime.now(KST);

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDate(key, date)
                .orElseThrow(() -> new EntityNotFoundException("해당 날짜에 저장한 착장이 없습니다. date=" + date));

        FeedbackRating enumRating = toFeedbackRating(rating);

        try {
            history.submitFeedbackOnce(enumRating, now); // ★ 엔티티 메서드 그대로 사용
        } catch (IllegalStateException e) {
            throw new ConflictException("이미 피드백이 제출되었습니다.");
        }

        OutfitHistory saved = outfitHistoryRepository.save(history);

        try {
            sessionLogJdbcRepository.insert(
                    SessionLogRequestDto.builder()
                            .userId(null)
                            .sessionKey(key)
                            .eventType(SessionEventType.OUTFIT_FEEDBACK_SUBMITTED)
                            .payload(Map.of("feedbackScore", enumRating.toScore(), "date", date.toString()))
                            .build()
            );
        } catch (Exception ignored) {}

        return OutfitResponseDto.Today.from(saved);
    }

    private FeedbackRating toFeedbackRating(Integer score) {
        if (score == null) throw new IllegalArgumentException("rating is required");
        return switch (score) {
            case 1 -> FeedbackRating.GOOD;
            case 0 -> FeedbackRating.UNKNOWN;
            case -1 -> FeedbackRating.BAD;
            default -> throw new IllegalArgumentException("rating must be -1/0/1");
        };
    }

    // =========================
    // internal
    // =========================
    private List<OutfitRequestDto.Item> normalizeItems(List<OutfitRequestDto.Item> items) {
        if (items == null || items.isEmpty()) throw new IllegalArgumentException("items는 1개 이상 필요합니다.");

        List<OutfitRequestDto.Item> cleaned = new ArrayList<>();
        for (OutfitRequestDto.Item it : items) {
            if (it == null) continue;
            if (it.getClothingId() == null) continue;
            cleaned.add(it);
        }
        if (cleaned.isEmpty()) throw new IllegalArgumentException("items는 1개 이상 필요합니다.");

        cleaned.sort((a, b) -> {
            int sa = (a.getSortOrder() <= 0 ? Integer.MAX_VALUE : a.getSortOrder());
            int sb = (b.getSortOrder() <= 0 ? Integer.MAX_VALUE : b.getSortOrder());
            return Integer.compare(sa, sb);
        });

        LinkedHashMap<Long, OutfitRequestDto.Item> uniq = new LinkedHashMap<>();
        for (OutfitRequestDto.Item it : cleaned) uniq.putIfAbsent(it.getClothingId(), it);
        return new ArrayList<>(uniq.values());
    }

    private List<Long> extractClothingIds(List<OutfitRequestDto.Item> items) {
        List<Long> ids = new ArrayList<>(items.size());
        for (OutfitRequestDto.Item it : items) ids.add(it.getClothingId());
        return ids;
    }
}