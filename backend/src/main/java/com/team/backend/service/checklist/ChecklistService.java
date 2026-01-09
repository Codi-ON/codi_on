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
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ChecklistService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private static final String EVENT_CHECKLIST_SUBMITTED = "CHECKLIST_SUBMITTED";
    private static final String FUNNEL_STEP_CHECKLIST = "CHECKLIST";

    private final SessionService sessionService;
    private final ChecklistJdbcRepository checklistRepo;
    private final RecommendationEventLogJdbcRepository recoLogRepo;

    /**
     * 오늘 체크리스트 제출(멱등)
     * - 최초: recoId 생성 + 로그 1회 insert
     * - 재호출: 기존 recoId 반환(created=false)
     */
    public ChecklistSubmitResponseDto submitToday(String sessionKey, ChecklistSubmitRequestDto req) {
        if (req == null) throw new IllegalArgumentException("request is null");

        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        // 단일 thicknessLevel 기준
        if (req.getThicknessLevel() == null) {
            throw new IllegalArgumentException("thicknessLevel은 필수입니다.");
        }

        LocalDate today = LocalDate.now(KST);

        UUID existing = checklistRepo.findTodayChecklistRecommendationId(key, today);
        if (existing != null) {
            return new ChecklistSubmitResponseDto(existing.toString(), today, false);
        }

        UUID recoId = UUID.randomUUID();
        Map<String, Object> payload = req.toPayload();

        recoLogRepo.insert(RecommendationEventLogRequestDto.builder()
                .createdAt(null) // null이면 DB now()
                .userId(null)
                .sessionKey(key)
                .recommendationId(recoId)
                .funnelStep(FUNNEL_STEP_CHECKLIST)
                .eventType(EVENT_CHECKLIST_SUBMITTED)
                .payload(payload)
                .build());

        return new ChecklistSubmitResponseDto(recoId.toString(), today, true);
    }

    /**
     * 오늘 체크리스트(제출 여부) 조회
     * - 있으면: recoId 반환(created=false)
     * - 없으면: recommendationId=null 로 내려서(=data는 null 아님) ApiResponse가 500 안 나게 함
     */
    // src/main/java/com/team/backend/service/checklist/ChecklistService.java
    @Transactional(readOnly = true)
    public ChecklistSubmitResponseDto getToday(String sessionKey) {
        String key = sessionService.validateOnly(sessionKey);

        LocalDate today = LocalDate.now(KST);

        UUID existing = checklistRepo.findTodayChecklistRecommendationId(key, today);
        if (existing == null) return null; // 컨트롤러에서 200 + data:null

        return new ChecklistSubmitResponseDto(existing.toString(), today, false);
    }
}