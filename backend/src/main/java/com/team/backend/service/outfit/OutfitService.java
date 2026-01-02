package com.team.backend.service.outfit;

import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.common.exception.ConflictException;
import com.team.backend.domain.DailyWeather;
import com.team.backend.domain.enums.outfit.FeedbackRating;
import com.team.backend.domain.enums.session.SessionEventType;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import com.team.backend.repository.outfit.OutfitHistoryRepository;
import com.team.backend.repository.weather.DailyWeatherRepository;
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
@Transactional
public class OutfitService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private static final String DEFAULT_REGION = "Seoul";

    private final SessionService sessionService;
    private final OutfitHistoryRepository outfitHistoryRepository;
    private final DailyWeatherRepository dailyWeatherRepository;
    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    // =========================
    // WRITE: 오늘 아웃핏 저장 (덮어쓰기)
    // - 날씨 스냅샷(outfit_history에 복사 저장)
    // - 피드백은 초기화(정책)
    // =========================
    public OutfitResponseDto.Today saveToday(String sessionKey, OutfitRequestDto.SaveToday req) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        LocalDate today = LocalDate.now(KST);

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
            items.add(OutfitHistoryItem.of(history, src.getClothingId(), i + 1));
        }

        history.replaceItems(items);

        // ✅ 정책: 덮어쓰기 시 피드백 초기화
        history.resetFeedback();

        // ✅ 저장 시점 날씨 스냅샷 (조회만 / 없으면 null 유지)
        DailyWeather w = dailyWeatherRepository.findByRegionAndDate(DEFAULT_REGION, today).orElse(null);
        if (w != null) {
            history.applyWeatherSnapshot(
                    w.getTemperature(),
                    w.getSky(),
                    w.getFeelsLikeTemperature(),
                    w.getCloudAmount()
            );
        }

        OutfitHistory saved = outfitHistoryRepository.save(history);

        // 로그(실패해도 기능 실패 금지)
        try {
            sessionLogJdbcRepository.insert(
                    SessionLogRequestDto.builder()
                            .sessionKey(key)
                            .eventType(SessionEventType.OUTFIT_SAVED)
                            .payload(Map.of("date", today.toString(), "clothingIds", clothingIds))
                            .build()
            );
        } catch (Exception ignored) {
        }

        return OutfitResponseDto.Today.from(saved);
    }

    // =========================
    // READ: 오늘 조회 (스냅샷만)
    // =========================
    @Transactional(readOnly = true)
    public OutfitResponseDto.Today getToday(String sessionKey) {
        String key = sessionService.validateOnly(sessionKey);
        LocalDate today = LocalDate.now(KST);

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDate(key, today)
                .orElseThrow(() -> new EntityNotFoundException("오늘 저장한 착장이 없습니다. date=" + today));

        history.getItems().size(); // LAZY 방지
        return OutfitResponseDto.Today.from(history);
    }

    // =========================
    // READ: 월간 캘린더 (스냅샷만)
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

        List<OutfitResponseDto.MonthlyDay> days = new ArrayList<>(rows.size());

        for (OutfitHistory h : rows) {
            List<OutfitHistoryItem> items = new ArrayList<>(h.getItems());
            items.sort(Comparator.comparing(OutfitHistoryItem::getSortOrder));

            List<OutfitResponseDto.MonthlyItem> dtoItems = new ArrayList<>(items.size());
            for (OutfitHistoryItem it : items) {
                dtoItems.add(OutfitResponseDto.MonthlyItem.builder()
                        .clothingId(it.getClothingId())
                        .sortOrder(it.getSortOrder())
                        .imageUrl(null) // 다음 단계
                        .build());
            }

            FeedbackRating fr = h.getFeedbackRating();
            Integer score = (fr == null) ? null : fr.toScore();

            days.add(OutfitResponseDto.MonthlyDay.builder()
                    .date(h.getOutfitDate().toString())
                    .items(dtoItems)
                    .feedbackScore(score)
                    .weatherTemp(h.getWeatherTemp())
                    .condition(h.getWeatherCondition())
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
    // FEEDBACK: 날짜별 1회 제한
    // - 컨트롤러가 호출하는 시그니처 그대로 제공
    // =========================
    public OutfitResponseDto.Today submitFeedbackOnce(String sessionKey, LocalDate date, Integer rating) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        if (date == null) throw new IllegalArgumentException("date is required");

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDate(key, date)
                .orElseThrow(() -> new EntityNotFoundException("해당 날짜에 저장한 착장이 없습니다. date=" + date));

        FeedbackRating enumRating = toFeedbackRating(rating);

        try {
            history.submitFeedbackOnce(enumRating);
        } catch (IllegalStateException e) {
            throw new ConflictException("이미 피드백이 제출되었습니다.");
        }

        OutfitHistory saved = outfitHistoryRepository.save(history);

        try {
            sessionLogJdbcRepository.insert(
                    SessionLogRequestDto.builder()
                            .sessionKey(key)
                            .eventType(SessionEventType.OUTFIT_FEEDBACK_SUBMITTED)
                            .payload(Map.of("date", date.toString(), "feedbackScore", enumRating.toScore()))
                            .build()
            );
        } catch (Exception ignored) {
        }

        return OutfitResponseDto.Today.from(saved);
    }

    // today alias (호환)
    public OutfitResponseDto.Today submitTodayFeedback(String sessionKey, Integer rating) {
        LocalDate today = LocalDate.now(KST);
        return submitFeedbackOnce(sessionKey, today, rating);
    }

    // =========================
    // internal
    // =========================
    private FeedbackRating toFeedbackRating(Integer score) {
        if (score == null) throw new IllegalArgumentException("rating is required");
        return switch (score) {
            case 1 -> FeedbackRating.GOOD;
            case 0 -> FeedbackRating.UNKNOWN;
            case -1 -> FeedbackRating.BAD;
            default -> throw new IllegalArgumentException("rating must be -1/0/1");
        };
    }

    private List<OutfitRequestDto.Item> normalizeItems(List<OutfitRequestDto.Item> items) {
        if (items == null || items.isEmpty()) throw new IllegalArgumentException("items는 1개 이상 필요합니다.");

        List<OutfitRequestDto.Item> cleaned = new ArrayList<>();
        for (OutfitRequestDto.Item it : items) {
            if (it == null) continue;
            Long clothingId = it.getClothingId();
            if (clothingId == null) continue;
            cleaned.add(it);
        }
        if (cleaned.isEmpty()) throw new IllegalArgumentException("items는 1개 이상 필요합니다.");

        cleaned.sort((a, b) -> {
            int sa = (a.getSortOrder() <= 0 ? Integer.MAX_VALUE : a.getSortOrder());
            int sb = (b.getSortOrder() <= 0 ? Integer.MAX_VALUE : b.getSortOrder());
            return Integer.compare(sa, sb);
        });

        LinkedHashMap<Long, OutfitRequestDto.Item> uniq = new LinkedHashMap<>();
        for (OutfitRequestDto.Item it : cleaned) {
            uniq.putIfAbsent(it.getClothingId(), it);
        }
        return new ArrayList<>(uniq.values());
    }

    private List<Long> extractClothingIds(List<OutfitRequestDto.Item> items) {
        List<Long> ids = new ArrayList<>(items.size());
        for (OutfitRequestDto.Item it : items) ids.add(it.getClothingId());
        return ids;
    }
}