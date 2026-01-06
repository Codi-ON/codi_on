// src/main/java/com/team/backend/service/log/RecommendationEventLogService.java
package com.team.backend.service.log;

import com.team.backend.api.dto.log.RecommendationEventLogRequestDto;
import com.team.backend.repository.log.RecommendationEventLogJdbcRepository;
import com.team.backend.service.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RecommendationEventLogService {

    private final SessionService sessionService;
    private final RecommendationEventLogJdbcRepository repo;

    public void write(RecommendationEventLogRequestDto dto) {
        if (dto == null) throw new IllegalArgumentException("dto is null");
        if (dto.getEventType() == null || dto.getEventType().isBlank())
            throw new IllegalArgumentException("eventType is required");
        if (dto.getSessionKey() == null || dto.getSessionKey().isBlank())
            throw new IllegalArgumentException("sessionKey is required");

        // 세션키 정책: header/body 들어온 걸 최종적으로 validateOnly + ensure
        String key = sessionService.validateOnly(dto.getSessionKey());
        sessionService.ensureSession(key);

        // validateOnly에서 정규화된 key로 overwrite (선택)
        // dto.setSessionKey(...) 가 없으니, repo에 key를 다시 세팅해주는 형태로 가려면
        // DTO를 불변으로 바꾸거나, repo.insert 파라미터를 key로 분리하면 됨.
        // 현재는 dto.sessionKey 그대로 쓰되 validateOnly/ensure로 보증만 한다.

        repo.insert(dto);
    }
}