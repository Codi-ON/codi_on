// src/main/java/com/team/backend/service/outfit/OutfitService.java
package com.team.backend.service.outfit;

import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.domain.ClothingItem;
import com.team.backend.domain.DailyWeather;
import com.team.backend.domain.enums.feadback.FeedbackRating;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import com.team.backend.repository.clothing.ClothingItemRepository;
import com.team.backend.repository.outfit.OutfitHistoryRepository;
import com.team.backend.repository.weather.DailyWeatherRepository;
import com.team.backend.service.session.SessionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.team.backend.api.dto.clothingItem.ClothingItemSummaryDto;


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

    @Transactional(readOnly = true)
    public List<ClothingItemSummaryDto> getSummaryByClothingIds(List<Long> clothingIds) {
        if (clothingIds == null || clothingIds.isEmpty()) {
            throw new IllegalArgumentException("ids is required");
        }

        // clothing_id 기준 조회 (PK id 기준 아님)
        List<ClothingItem> rows = clothingItemRepository.findByClothingIdIn(clothingIds);

        Map<Long, ClothingItem> map = rows.stream()
                .collect(Collectors.toMap(ClothingItem::getClothingId, Function.identity(), (a, b) -> a));

        // 요청 ids 순서 유지
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

        // items 정규화(중복 제거/정렬/유효성 체크는 normalizeItems에서)
        List<OutfitRequestDto.Item> cleaned = normalizeItems(req.getItems());

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDateWithItems(key, today)
                .orElseGet(() -> OutfitHistory.builder()
                        .sessionKey(key)
                        .outfitDate(today)
                        .build()
                );

        // 전략 저장(null 허용)
        history.setRecoStrategy(req.getRecoStrategy());

        // 정책: 저장(덮어쓰기) 시 기존 피드백 초기화
        history.resetFeedback();

        // ===== 핵심: 기존 items 먼저 삭제 후 flush (uk_outfit_history_item_history_sort 충돌 방지) =====
        if (history.getId() != null) {
            history.getItems().clear();                       // orphanRemoval 대상
            outfitHistoryRepository.saveAndFlush(history);    // DELETE 먼저 DB에 반영
        }

        // 새 아이템으로 교체
        List<OutfitHistoryItem> newItems = new ArrayList<>(cleaned.size());
        for (OutfitRequestDto.Item it : cleaned) {
            newItems.add(OutfitHistoryItem.of(history, it.getClothingId(), it.getSortOrder()));
        }
        history.replaceItems(newItems);

        OutfitHistory saved = outfitHistoryRepository.save(history);
        saved.getItems().size(); // 응답 생성 시 LAZY 방지

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
    // OutfitService.java 내부

    @Transactional(readOnly = true)
    public OutfitResponseDto.MonthlyHistory getMonthlyHistory(String sessionKey, int year, int month) {
        String key = sessionService.validateOnly(sessionKey);

        if (year < 2000 || year > 2100) throw new IllegalArgumentException("year is invalid");
        if (month < 1 || month > 12) throw new IllegalArgumentException("month is invalid");

        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate toExclusive = ym.plusMonths(1).atDay(1);
        LocalDate toInclusive = toExclusive.minusDays(1);

        // 1) outfits (source of truth)
        List<OutfitHistory> rows = outfitHistoryRepository.findMonthlyWithItems(key, from, toExclusive);

        // 2) weather fallback (region 고정)
        List<DailyWeather> weathers =
                dailyWeatherRepository.findAllByRegionAndDateBetweenOrderByDateAsc("Seoul", from, toInclusive);

        Map<LocalDate, DailyWeather> weatherByDate = new HashMap<>();
        for (DailyWeather w : weathers) weatherByDate.put(w.getDate(), w);

        // 3) dto 조립
        List<OutfitResponseDto.MonthlyDay> days = new ArrayList<>(rows.size());

        for (OutfitHistory h : rows) {
            // items 정렬
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

            // ✅ weather: outfit_history 스냅샷 우선, 없으면 daily_weather로 fallback
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
                    .weatherFeelsLike(feelsLike)          // MonthlyDay에 필드 없으면 제거
                    .weatherCloudAmount(cloudAmount)      // MonthlyDay에 필드 없으면 제거
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
            case -1 -> FeedbackRating.BAD;
            case 0 -> FeedbackRating.UNKNOWN;
            case 1 -> FeedbackRating.GOOD;
            default -> throw new IllegalArgumentException("rating은 필수입니다.");
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