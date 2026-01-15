// src/main/java/com/team/backend/service/checklist/ChecklistService.java
package com.team.backend.service.checklist;

import com.team.backend.api.dto.checklist.ChecklistSubmitRequestDto;
import com.team.backend.api.dto.checklist.ChecklistSubmitResponseDto;
import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.api.dto.log.SessionLogRequestDto;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.repository.checklist.ChecklistJdbcRepository;
import com.team.backend.repository.log.RecommendationEventLogJdbcRepository;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ChecklistService {

    private static final String EVENT_CHECKLIST_SUBMITTED = "CHECKLIST_SUBMITTED";
    private static final String FUNNEL_STEP_CHECKLIST = "CHECKLIST";

    private static final String SESSION_EVENT_START = "START";

    private final SessionService sessionService;
    private final ChecklistJdbcRepository checklistRepo;
    private final RecommendationEventLogJdbcRepository recoLogRepo;
    private final SessionLogJdbcRepository sessionLogRepo;

    /**
     * 오늘 체크리스트 제출(멱등)
     * - 최초: recoId 생성 + START 1회 + CHECKLIST_SUBMITTED 1회
     * - 재호출: 기존 recoId 반환(created=false), 로그 추가 없음(멱등 유지)
     */
    public ChecklistSubmitResponseDto submitToday(String sessionKey, ChecklistSubmitRequestDto req) {
        if (req == null) throw new IllegalArgumentException("request is null");

        String key = sessionService.validateOnly(sessionKey);
        sessionService.ensureSession(key);

        if (req.getThicknessLevel() == null) {
            throw new IllegalArgumentException("thicknessLevel은 필수입니다.");
        }

        LocalDate today = TimeRanges.todayKst();

        UUID existing = checklistRepo.findTodayChecklistRecommendationId(key, today);
        if (existing != null) {
            // 기존 재사용: created=false
            return new ChecklistSubmitResponseDto(existing.toString(), today, false);
        }

        UUID recoId = UUID.randomUUID();

        // 1) START (신규 발급 시점에 1회)
        // createdAt=null -> DB now()로 들어가게(Repo SQL이 COALESCE 처리되어 있어야 함)
        sessionLogRepo.insert(SessionLogRequestDto.builder()
                .createdAt(null)
                .userId(null)
                .sessionKey(key)
                .eventType(SESSION_EVENT_START)
                .payload(Map.of(
                        "source", "CHECKLIST_SUBMIT",
                        "recommendationId", recoId.toString()
                ))
                .build());

        // 2) CHECKLIST_SUBMITTED (신규 발급 시점에 1회)
        // payload는 "체크리스트 원본" + sessionKey / clientDateISO까지 함께 저장
        Map<String, Object> payload = new LinkedHashMap<>(req.toPayload());
        payload.put("sessionKey", key);           // 나중에 세션키로 조회 가능하게
        payload.put("clientDateISO", today.toString()); // YYYY-MM-DD (KST today 기준)

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
     * 오늘 체크리스트 제출 여부 조회
     * - 있으면: recoId 반환(created=false)
     * - 없으면: null 반환(컨트롤러에서 200 + data:null 처리)
     */
    @Transactional(readOnly = true)
    public ChecklistSubmitResponseDto getToday(String sessionKey) {
        String key = sessionService.validateOnly(sessionKey);

        LocalDate today = TimeRanges.todayKst();

        UUID existing = checklistRepo.findTodayChecklistRecommendationId(key, today);
        if (existing == null) return null;

        return new ChecklistSubmitResponseDto(existing.toString(), today, false);
    }
}