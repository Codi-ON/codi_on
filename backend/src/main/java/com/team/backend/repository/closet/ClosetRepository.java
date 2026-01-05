package com.team.backend.repository.closet;

import com.team.backend.domain.Closet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClosetRepository extends JpaRepository<Closet, Long> {
    Optional<Closet> findBySessionKey(String sessionKey);
}