// src/main/java/com/team/backend/api/dto/admin/dashboard/DashboardMonthlyResponseDto.java
package com.team.backend.api.dto.admin.dashboard;

import lombok.Builder;
import java.util.List;

@Builder
public record DashboardMonthlyResponseDto(
        List<DashboardMonthlyRowResponseDto> rows
) {}