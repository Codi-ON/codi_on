package com.team.backend.service.outfit;// src/main/java/com/team/backend/service/outfit/OutfitService.java

import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.api.dto.session.SessionLogRequestDto;
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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class OutfitService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

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
                    .sortOrder(i + 1) // 정규화 후 1..N 재부여
                    .build());
        }

        history.replaceItems(items, now);
        OutfitHistory saved = outfitHistoryRepository.save(history);

        // 대시보드 로그(실패해도 기능 실패 금지)
        try {
            sessionLogJdbcRepository.insert(
                    SessionLogRequestDto.builder()
                            .userId(null)
                            .sessionKey(key)
                            .eventType(SessionEventType.OUTFIT_SAVED) // enum 없으면 추가/기존 타입으로 교체
                            .payload(Map.of("clothingIds", clothingIds))
                            .build()
            );
        } catch (Exception ignored) {
        }

        // 정책: data는 Today(오늘 아웃핏) 전체 재반환
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

        // LAZY 방지 (fetch join 아닌 경우)
        history.getItems().size();
        return OutfitResponseDto.Today.from(history);
    }

    /**
     * 월 단위 히스토리(캘린더용)
     * - 기록 없는 날 제외
     * - GET: validateOnly만
     */

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
                        .imageUrl(null) // 다음 배치
                        .build());
            }

            days.add(OutfitResponseDto.MonthlyDay.builder()
                    .date(h.getOutfitDate().toString())
                    .items(dtoItems)
                    .feedbackScore(h.getFeedbackRating()) // Integer(-1/0/1) or null
                    .weatherTemp(null) // 다음 배치
                    .condition(null)   // 다음 배치
                    .build());
        }

        // repo에서 order by 했어도 안전하게
        days.sort(Comparator.comparing(OutfitResponseDto.MonthlyDay::getDate));

        return OutfitResponseDto.MonthlyHistory.builder()
                .year(year)
                .month(month)
                .days(days)
                .build();
    }



   public OutfitResponseDto.Today submitTodayFeedback(String sessionKey, Integer rating) {
        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        LocalDate today = LocalDate.now(KST);

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDate(key, today)
                .orElseThrow(() -> new EntityNotFoundException("오늘 저장한 착장이 없습니다. date=" + today));

        // 1회만 + 값은 -1/0/1만 (도메인에서 검증)
        history.submitFeedbackOnce(rating);

        OutfitHistory saved = outfitHistoryRepository.save(history);

        // 로그는 optional (실패해도 기능 성공)
        try {
            sessionLogJdbcRepository.insert(
                    SessionLogRequestDto.builder()
                            .userId(null)
                            .sessionKey(key)
                            .eventType(SessionEventType.OUTFIT_SAVED)
                            .payload(Map.of("rating", rating))
                            .build()
            );
        } catch (Exception ignored) {}

        // 요구사항: 성공 시 Today(오늘 아웃핏) "전체 재반환"
        return OutfitResponseDto.Today.from(saved);
    }
    // =========================
    // internal
    // =========================
    private List<OutfitRequestDto.Item> normalizeItems(List<OutfitRequestDto.Item> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("items는 1개 이상 필요합니다.");
        }

        // 1) 유효 clothingId만 추출
        List<OutfitRequestDto.Item> cleaned = new ArrayList<>();
        for (OutfitRequestDto.Item it : items) {
            if (it == null) continue;
            Long clothingId = it.getClothingId();
            if (clothingId == null) continue;
            cleaned.add(it);
        }
        if (cleaned.isEmpty()) throw new IllegalArgumentException("items는 1개 이상 필요합니다.");

        // 2) sortOrder 기준 정렬(없거나 0이면 뒤로)
        cleaned.sort((a, b) -> {
            int sa = (a.getSortOrder() <= 0 ? Integer.MAX_VALUE : a.getSortOrder());
            int sb = (b.getSortOrder() <= 0 ? Integer.MAX_VALUE : b.getSortOrder());
            return Integer.compare(sa, sb);
        });

        // 3) clothingId 중복 제거(첫 등장만 유지)
        LinkedHashMap<Long, OutfitRequestDto.Item> uniq = new LinkedHashMap<>();
        for (OutfitRequestDto.Item it : cleaned) {
            uniq.putIfAbsent(it.getClothingId(), it);
        }

        return new ArrayList<>(uniq.values());
    }

    private List<Long> extractClothingIds(List<OutfitRequestDto.Item> items) {
        List<Long> ids = new ArrayList<>(items.size());
        for (OutfitRequestDto.Item it : items) {
            ids.add(it.getClothingId());
        }
        return ids;
    }
}