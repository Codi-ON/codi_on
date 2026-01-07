// src/main/java/com/team/backend/service/checklist/ChecklistService.java
package com.team.backend.service.checklist;

import com.team.backend.api.dto.checklist.ChecklistSubmitRequestDto;
import com.team.backend.api.dto.checklist.ChecklistSubmitResponseDto;
import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.repository.checklist.ChecklistJdbcRepository;
import com.team.backend.repository.log.RecommendationEventLogJdbcRepository;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ChecklistService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private static final String EVENT_CHECKLIST_SUBMITTED = "CHECKLIST_SUBMITTED";
    private static final String FUNNEL_STEP_CHECKLIST = "CHECKLIST"; // optional

    private final SessionService sessionService;
    private final ChecklistJdbcRepository checklistRepo;
    private final RecommendationEventLogJdbcRepository recoLogRepo;

    public ChecklistSubmitResponseDto submitToday(String sessionKey, ChecklistSubmitRequestDto req) {
        if (req == null) throw new IllegalArgumentException("request is null");

        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);


        if (req.getThicknessLevels() == null || req.getThicknessLevels().stream().filter(Objects::nonNull).findAny().isEmpty()) {
            throw new IllegalArgumentException("thicknessLevels는 1개 이상 필요합니다.");
        }

        LocalDate today = LocalDate.now(KST);


        UUID existing = checklistRepo.findTodayChecklistRecommendationId(key, today);
        if (existing != null) {
            return new ChecklistSubmitResponseDto(existing.toString(), today, false);
        }

        UUID recoId = UUID.randomUUID();
        Map<String, Object> payload = req.toPayload();

        recoLogRepo.insert(RecommendationEventLogRequestDto.builder()
                .createdAt(null)               // null이면 DB now()
                .userId(null)
                .sessionKey(key)
                .recommendationId(recoId)
                .funnelStep(FUNNEL_STEP_CHECKLIST)
                .eventType(EVENT_CHECKLIST_SUBMITTED)
                .payload(payload)
                .build());

        return new ChecklistSubmitResponseDto(recoId.toString(), today, true);
    }
}