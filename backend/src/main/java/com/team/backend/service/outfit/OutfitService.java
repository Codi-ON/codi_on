// src/main/java/com/team/backend/service/outfit/OutfitService.java
package com.team.backend.service.outfit;

import com.team.backend.api.dto.clothingItem.ClothingItemSummaryDto;
import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.DailyWeather;
import com.team.backend.domain.enums.feadback.FeedbackRating;
import com.team.backend.domain.enums.recommendation.RecommendationEventType;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import com.team.backend.repository.checklist.ChecklistJdbcRepository;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.repository.outfit.OutfitHistoryRepository;
import com.team.backend.repository.weather.DailyWeatherRepository;
import com.team.backend.service.log.RecommendationEventLogService;
import com.team.backend.service.session.SessionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OutfitService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final OutfitHistoryRepository outfitHistoryRepository;
    private final SessionService sessionService;
    private final DailyWeatherRepository dailyWeatherRepository;
    private final ClothingItemRepository clothingItemRepository;

    // recoId 역조회 + 이벤트 로그 insert
    private final ChecklistJdbcRepository checklistJdbcRepository;
    private final RecommendationEventLogService recommendationEventLogService;

    @Transactional(readOnly = true)
    public List<ClothingItemSummaryDto> getSummaryByClothingIds(List<Long> clothingIds) {
        if (clothingIds == null || clothingIds.isEmpty()) {
            throw new IllegalArgumentException("ids is required");
        }

        List<ClothingItem> rows = clothingItemRepository.findByClothingIdIn(clothingIds);

        Map<Long, ClothingItem> map = rows.stream()
                .collect(Collectors.toMap(ClothingItem::getClothingId, Function.identity(), (a, b) -> a));

        return clothingIds.stream()
                .map(map::get)
                .filter(Objects::nonNull)
                .map(ClothingItemSummaryDto::from)
                .toList();
    }

    // =========================
    // SAVE : 오늘 아웃핏 저장
    // =========================
    @Transactional
    public OutfitResponseDto.Today saveToday(String sessionKey, OutfitRequestDto.SaveToday req) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

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

        history.setRecoStrategy(req.getRecoStrategy());
        history.resetFeedback();

        // uk_outfit_history_item_history_sort 충돌 방지: 기존 items 먼저 삭제 후 flush
        if (history.getId() != null) {
            history.getItems().clear();
            outfitHistoryRepository.saveAndFlush(history);
        }

        List<OutfitHistoryItem> newItems = new ArrayList<>(cleaned.size());
        for (OutfitRequestDto.Item it : cleaned) {
            newItems.add(OutfitHistoryItem.of(history, it.getClothingId(), it.getSortOrder()));
        }
        history.replaceItems(newItems);

        OutfitHistory saved = outfitHistoryRepository.save(history);
        saved.getItems().size(); // LAZY 방지

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

        history.getItems().size(); // LAZY 방지
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
        LocalDate toInclusive = toExclusive.minusDays(1);

        List<OutfitHistory> rows = outfitHistoryRepository.findMonthlyWithItems(key, from, toExclusive);

        // weather fallback (region 고정)
        List<DailyWeather> weathers =
                dailyWeatherRepository.findAllByRegionAndDateBetweenOrderByDateAsc("Seoul", from, toInclusive);

        Map<LocalDate, DailyWeather> weatherByDate = new HashMap<>();
        for (DailyWeather w : weathers) weatherByDate.put(w.getDate(), w);

        List<OutfitResponseDto.MonthlyDay> days = new ArrayList<>(rows.size());

        for (OutfitHistory h : rows) {
            List<OutfitHistoryItem> items = new ArrayList<>(h.getItems());
            items.sort(Comparator.comparingInt(OutfitHistoryItem::getSortOrder));

            List<OutfitResponseDto.Item> dtoItems = new ArrayList<>(items.size());
            for (OutfitHistoryItem it : items) {
                dtoItems.add(OutfitResponseDto.Item.builder()
                        .clothingId(it.getClothingId())
                        .sortOrder(it.getSortOrder())
                        .build());
            }

            Integer feedbackScore = (h.getFeedbackRating() == null) ? null : h.getFeedbackRating().toScore();

            DailyWeather fw = weatherByDate.get(h.getOutfitDate());

            Double weatherTemp = (h.getWeatherTemp() != null) ? h.getWeatherTemp() : (fw == null ? null : fw.getTemperature());
            String condition = (h.getWeatherCondition() != null) ? h.getWeatherCondition() : (fw == null ? null : fw.getSky());

            Double feelsLike = (h.getWeatherFeelsLike() != null) ? h.getWeatherFeelsLike() : (fw == null ? null : fw.getFeelsLikeTemperature());
            Integer cloudAmount = (h.getWeatherCloudAmount() != null) ? h.getWeatherCloudAmount() : (fw == null ? null : fw.getCloudAmount());

            days.add(OutfitResponseDto.MonthlyDay.builder()
                    .date(h.getOutfitDate().toString())
                    .items(dtoItems)
                    .feedbackScore(feedbackScore)
                    .weatherTemp(weatherTemp)
                    .condition(condition)
                    .weatherFeelsLike(feelsLike)
                    .weatherCloudAmount(cloudAmount)
                    .recoStrategy(h.getRecoStrategy())
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
    // FEEDBACK : 날짜 지정 1회 제출 (+ reco log)
    // =========================
    @Transactional
    public OutfitResponseDto.Today submitFeedbackOnce(
            String sessionKey,
            LocalDate date,
            Integer ratingInt,
            String recommendationId
    ) {
        String key = sessionService.validateOnly(sessionKey);
        if (date == null) throw new IllegalArgumentException("date is required");

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDateWithItems(key, date)
                .orElseThrow(() -> new EntityNotFoundException("해당 날짜에 저장한 착장이 없습니다. date=" + date));

        FeedbackRating rating = toFeedbackRating(ratingInt);
        history.submitFeedbackOnce(rating);

        OutfitHistory saved = outfitHistoryRepository.save(history);
        saved.getItems().size(); // LAZY 방지

        // ✅ recoId 결정 우선순위:
        // 1) 클라에서 recommendationId가 넘어오면 그걸 사용
        // 2) 없으면(레거시) 이벤트로그에서 해당 날짜 recoId 역조회
        UUID recoId = null;

        if (recommendationId != null && !recommendationId.isBlank()) {
            try {
                recoId = UUID.fromString(recommendationId);
            } catch (IllegalArgumentException ignore) {
                // 형식 불량이면 아래 fallback으로 시도
            }
        }

        if (recoId == null) {
            recoId = checklistJdbcRepository.findTodayChecklistRecommendationId(key, date);
        }

        if (recoId != null) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("date", date.toString());
            payload.put("rating", ratingInt);
            payload.put("ratingEnum", rating.name());
            payload.put("outfitHistoryId", saved.getId());

            recommendationEventLogService.write(
                    RecommendationEventLogRequestDto.builder()
                            .createdAt(null) // DB now()
                            .userId(null)
                            .sessionKey(key)
                            .recommendationId(recoId)
                            .funnelStep("FEEDBACK")
                            .eventType(RecommendationEventType.RECO_FEEDBACK_SUBMITTED.name())
                            .payload(payload)
                            .build()
            );
        }

        return OutfitResponseDto.Today.from(saved);
    }

    @Transactional
    public OutfitResponseDto.Today submitTodayFeedback(String sessionKey, Integer ratingInt, String recommendationId) {
        LocalDate today = LocalDate.now(KST);
        return submitFeedbackOnce(sessionKey, today, ratingInt, recommendationId);
    }

    // =========================
    // helpers
    // =========================
    private FeedbackRating toFeedbackRating(Integer ratingInt) {
        if (ratingInt == null) throw new IllegalArgumentException("rating is required");
        return switch (ratingInt) {
            case -1 -> FeedbackRating.BAD;
            case 0 -> FeedbackRating.UNKNOWN;
            case 1 -> FeedbackRating.GOOD;
            default -> throw new IllegalArgumentException("rating은 필수입니다.");
        };
    }

    /**
     * 정책:
     * - items는 2~3개
     * - sortOrder는 1/2/3만 허용, 중복 금지
     * - 1(top), 2(bottom)은 필수
     * - clothingId 중복 금지
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