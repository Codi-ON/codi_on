// src/main/java/com/team/backend/repository/log/RecommendationEventLogRepository.java
package com.team.backend.repository.log;

import com.team.backend.domain.log.RecommendationEventLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;

public interface RecommendationEventLogRepository extends JpaRepository<RecommendationEventLog, Long> {

    @Query("""
        SELECT e
        FROM RecommendationEventLog e
        WHERE e.createdAt >= :from
          AND e.createdAt <  :to
        ORDER BY e.createdAt DESC
    """)
    List<RecommendationEventLog> findLogs(OffsetDateTime from, OffsetDateTime to, Pageable pageable);
}