// src/main/java/com/team/backend/service/session/SessionLogService.java
package com.team.backend.service.session;

import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.repository.log.SessionLogJdbcRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SessionLogService {

    private final SessionLogJdbcRepository sessionLogJdbcRepository;

    /**
     * 앱/웹에서 세션 이벤트를 찍어줄 때 사용하는 write 메서드
     */
    @Transactional
    public void write(@Valid SessionLogRequestDto dto) {
        sessionLogJdbcRepository.insert(dto);
    }

    /**
     * 컨트롤러에서 읽기 좋은 alias (선택)
     */
    @Transactional
    public void logSession(@Valid SessionLogRequestDto request) {
        write(request);
    }
}