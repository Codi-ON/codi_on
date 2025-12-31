// src/main/java/com/team/backend/service/outfit/OutfitService.java
package com.team.backend.service.outfit;

import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.common.time.TimeRanges;
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

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final SessionService sessionService;
    private final OutfitHistoryRepository outfitHistoryRepository;
    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    public OutfitResponseDto.Today saveToday(String sessionKey, OutfitRequestDto.SaveToday req) {
        final String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        final LocalDate today = LocalDate.now(KST);
        final OffsetDateTime now = TimeRanges.nowKst();

        final List<OutfitRequestDto.Item> items = normalizeItems(req);

        OutfitHistory history = outfitHistoryRepository
                .findBySessionKeyAndOutfitDate(key, today)
                .orElseGet(() -> OutfitHistory.builder()
                        .sessionKey(key)
                        .outfitDate(today)
                        .build()
                );

        List<OutfitHistoryItem> newItems = new ArrayList<>(items.size());
        for (OutfitRequestDto.Item it : items) {
            newItems.add(OutfitHistoryItem.builder()
                    .clothingId(it.getClothingId())
                    .sortOrder(it.getSortOrder())
                    .build());
        }

        history.replaceItems(newItems, now);
        OutfitHistory saved = outfitHistoryRepository.save(history);

        // 로그는 실패해도 기능 실패시키지 않음
        try {
            sessionLogJdbcRepository.insert(
                    SessionLogRequestDto.builder()
                            .userId(null)
                            .sessionKey(key)
                            .eventType(SessionEventType.OUTFIT_SAVED)
                            .payload(Map.of("items", items))
                            .build()
            );
        } catch (Exception ignore) {}

        return OutfitResponseDto.Today.from(saved);
    }

    @Transactional(readOnly = true)
    public OutfitResponseDto.Today getToday(String sessionKey) {
        final String key = sessionService.validateOnly(sessionKey);
        final LocalDate today = LocalDate.now(KST);

        OutfitHistory history = outfitHistoryRepository
                .findWithItemsBySessionKeyAndOutfitDate(key, today)
                .orElseThrow(() -> new EntityNotFoundException("오늘 저장한 착장이 없습니다. date=" + today));

        return OutfitResponseDto.Today.from(history);
    }

    private List<OutfitRequestDto.Item> normalizeItems(OutfitRequestDto.SaveToday req) {
        if (req == null || req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("items는 1개 이상 필요합니다.");
        }

        List<OutfitRequestDto.Item> raw = new ArrayList<>(req.getItems());
        raw.removeIf(Objects::isNull);

        raw.sort(Comparator.comparingInt(OutfitRequestDto.Item::getSortOrder));

        LinkedHashMap<Long, Integer> map = new LinkedHashMap<>();
        for (OutfitRequestDto.Item it : raw) {
            if (it.getClothingId() == null) continue;
            int so = it.getSortOrder();
            if (so <= 0) throw new IllegalArgumentException("sortOrder는 1 이상이어야 합니다.");
            map.putIfAbsent(it.getClothingId(), so);
        }

        if (map.isEmpty()) throw new IllegalArgumentException("items는 1개 이상 필요합니다.");

        List<OutfitRequestDto.Item> out = new ArrayList<>(map.size());
        for (Map.Entry<Long, Integer> e : map.entrySet()) {
            out.add(OutfitRequestDto.Item.builder().clothingId(e.getKey()).sortOrder(e.getValue()).build());
        }
        return out;
    }
}