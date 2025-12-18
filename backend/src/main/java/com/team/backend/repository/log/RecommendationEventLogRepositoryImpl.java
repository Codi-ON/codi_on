package com.team.backend.repository.log;// src/main/java/com/team/backend/repository/RecommendationEventLogRepository.java

import com.team.backend.domain.log.RecommendationEventLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface RecommendationEventLogRepositoryImpl extends JpaRepository<RecommendationEventLog, Long> {

    // 최근 로그 N개 (관리자/디버깅용)
    List<RecommendationEventLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 기간 + 이벤트 타입 필터(추적용)
    List<RecommendationEventLog> findByCreatedAtBetweenAndEventTypeInOrderByCreatedAtDesc(
            OffsetDateTime from,
            OffsetDateTime to,
            List<String> eventTypes
    );
}