package com.team.backend.service.outfit;

import com.team.backend.api.dto.outfit.OutfitRequestDto;
import com.team.backend.api.dto.outfit.OutfitResponseDto;
import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.domain.enums.session.SessionEventType;
import com.team.backend.domain.outfit.OutfitHistory;
import com.team.backend.domain.outfit.OutfitHistoryItem;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import com.team.backend.repository.outfit.OutfitHistoryRepository;
import com.team.backend.service.session.SessionService;
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
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(OutfitService.class);

    private final SessionService sessionService;
    private final OutfitHistoryRepository outfitHistoryRepository;
    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    // ✅ 체크용 (NamedParameterJdbcTemplate 또는 JdbcTemplate 아무거나)
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final jakarta.persistence.EntityManager em;

    public OutfitResponseDto.Today saveToday(String sessionKey, OutfitRequestDto.SaveToday req) {
        final String key = requireSessionKey(sessionKey);
        sessionService.ensureSession(key);

        final LocalDate today = LocalDate.now(KST);
        final OffsetDateTime now = OffsetDateTime.now(KST);

        // ✅ 0) 입력 검증 로그
        log.info("[OUTFIT] saveToday called. sessionKey={}, today(KST)={}, req={}", key, today, req);

        // ✅ 1) DB 불일치 확인(서버가 붙은 DB 정보)
        logDbIdentity("[OUTFIT] before save");

        // ✅ 2) clothingIds 정규화
        List<Long> clothingIds = normalizeIds(req.getClothingIds()); // DTO가 clothingIds 버전일 때
        log.info("[OUTFIT] normalized clothingIds={}", clothingIds);

        OutfitHistory history = outfitHistoryRepository
            .findBySessionKeyAndOutfitDate(key, today)
            .orElseGet(() -> OutfitHistory.builder()
                .sessionKey(key)
                .outfitDate(today)
                .build()
            );

        List<OutfitHistoryItem> items = new ArrayList<>(clothingIds.size());
        for (int i = 0; i < clothingIds.size(); i++) {
            items.add(OutfitHistoryItem.builder()
                .outfitHistory(history)
                .clothingId(clothingIds.get(i))
                .sortOrder(i + 1)
                .build());
        }

        history.replaceItems(items, now);

        OutfitHistory saved = outfitHistoryRepository.save(history);

        // ✅ 3) flush로 실제 INSERT/UPDATE 강제
        em.flush();

        log.info("[OUTFIT] saved outfit_history id={}, sessionKey={}, date={}", saved.getId(), key, today);

        // ✅ 4) 저장 직후 count 확인(같은 트랜잭션 내)
        Integer cntInTx = jdbcTemplate.queryForObject(
            "select count(*) from public.outfit_history where session_key = ? and outfit_date = ?",
            Integer.class, key, today
        );
        log.info("[OUTFIT] count right-after-save (same TX) = {}", cntInTx);

        // ✅ 5) 커밋된 뒤에도 보이는지 afterCommit에서 한번 더 체크
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
            new org.springframework.transaction.support.TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        logDbIdentity("[OUTFIT] afterCommit");
                        Integer cntAfterCommit = jdbcTemplate.queryForObject(
                            "select count(*) from public.outfit_history where session_key = ? and outfit_date = ?",
                            Integer.class, key, today
                        );
                        log.info("[OUTFIT] count afterCommit = {}", cntAfterCommit);
                    } catch (Exception e) {
                        log.warn("[OUTFIT] afterCommit check failed", e);
                    }
                }
            }
        );

        // ✅ 6) 로그는 실패해도 기능 실패시키지 않음
        try {
            sessionLogJdbcRepository.insert(
                SessionLogRequestDto.builder()
                    .userId(null)
                    .sessionKey(key)
                    .eventType(SessionEventType.OUTFIT_SAVED)
                    .payload(Map.of("clothingIds", clothingIds))
                    .build()
            );
        } catch (Exception e) {
            log.warn("[OUTFIT] session_log insert failed. sessionKey={}", key, e);
        }

        return OutfitResponseDto.Today.from(saved);
    }

    @Transactional(readOnly = true)
    public OutfitResponseDto.Today getToday(String sessionKey) {
        final String key = requireSessionKey(sessionKey);
        final LocalDate today = LocalDate.now(KST);

        logDbIdentity("[OUTFIT] getToday");

        OutfitHistory history = outfitHistoryRepository
            .findBySessionKeyAndOutfitDate(key, today)
            .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("오늘 저장한 착장이 없습니다. date=" + today));

        history.getItems().size();
        return OutfitResponseDto.Today.from(history);
    }

    private void logDbIdentity(String prefix) {
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                "select current_database() as db, inet_server_addr() as addr, inet_server_port() as port"
            );
            log.info("{} dbIdentity={}", prefix, row);
        } catch (Exception e) {
            log.warn("{} dbIdentity check failed", prefix, e);
        }
    }

    private String requireSessionKey(String sessionKey) {
        if (sessionKey == null || sessionKey.isBlank()) {
            throw new IllegalArgumentException("X-Session-Key is required");
        }
        return sessionKey.trim();
    }

    private List<Long> normalizeIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new IllegalArgumentException("clothingIds는 1개 이상 필요합니다.");

        LinkedHashSet<Long> set = new LinkedHashSet<>();
        for (Long id : ids) {
            if (id == null) continue;
            set.add(id);
        }
        if (set.isEmpty()) throw new IllegalArgumentException("clothingIds는 1개 이상 필요합니다.");
        return new ArrayList<>(set);
    }
}