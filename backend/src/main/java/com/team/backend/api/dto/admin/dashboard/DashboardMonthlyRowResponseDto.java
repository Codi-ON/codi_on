// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardMonthlyRowResponseDto.java
package com.team.backend.api.dto.admin.dashboard;

import lombok.Builder;

@Builder
public record DashboardMonthlyRowResponseDto(
        String month,              // "YYYY-MM"
        long startedSessions,
        long endedSessions,
        long errorEvents,
        long totalSessionEvents,
        long uniqueSessionUsers,
        long totalClicks,
        long uniqueClickUsers,
        long recoEventCount
) {}