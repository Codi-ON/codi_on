// src/main/java/com/team/backend/repository/session/SessionRepository.java
package com.team.backend.repository.session;

import com.team.backend.domain.session.Session;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    boolean existsBySessionKey(String sessionKey);

    Optional<Session> findBySessionKey(String sessionKey);

    /**
     * upsert + touch (write에서만 사용)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        INSERT INTO public.session (session_key, created_at, last_seen_at)
        VALUES (:sessionKey, :now, :now)
        ON CONFLICT (session_key)
        DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at
        """, nativeQuery = true)
    void upsertTouch(
            @Param("sessionKey") String sessionKey,
            @Param("now") OffsetDateTime now
    );

    /**
     * touch only (read에서 사용, upsert 금지)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE public.session
           SET last_seen_at = :now
         WHERE session_key = :sessionKey
        """, nativeQuery = true)
    int touchIfExists(
            @Param("sessionKey") String sessionKey,
            @Param("now") OffsetDateTime now
    );
}