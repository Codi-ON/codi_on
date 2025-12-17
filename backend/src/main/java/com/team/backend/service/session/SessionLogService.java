// src/main/java/com/team/backend/service/SessionLogService.java
package com.team.backend.service.session;

import com.team.backend.api.dto.session.SessionLogRequestDto;
import com.team.backend.repository.log.SessionLogJdbcRepository;
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
    public void write(SessionLogRequestDto dto) {
        sessionLogJdbcRepository.insert(dto);
    }
}