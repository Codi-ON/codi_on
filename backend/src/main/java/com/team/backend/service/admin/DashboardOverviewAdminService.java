// src/main/java/com/team/backend/service/admin/DashboardOverviewAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.repository.admin.DashboardOverviewJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;

@Service
@RequiredArgsConstructor
public class DashboardOverviewAdminService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final DashboardOverviewJdbcRepository repo;

    public DashboardOverviewResponseDto getOverview(LocalDate from, LocalDate to, int topN) {
        if (from == null || to == null) throw new IllegalArgumentException("from/to는 필수입니다.");
        if (from.isAfter(to)) throw new IllegalArgumentException("from은 to보다 클 수 없습니다.");

        // LocalDate 기간을 KST 기준 [from 00:00, to+1 00:00) 로 변환
        OffsetDateTime fromTs = from.atStartOfDay(KST).toOffsetDateTime();
        OffsetDateTime toExclusiveTs = to.plusDays(1).atStartOfDay(KST).toOffsetDateTime();

        var summaryRow = repo.findSummary(fromTs, toExclusiveTs);
        var dailySessionsRow = repo.findDailySessions(fromTs, toExclusiveTs);
        var dailyClicksRow = repo.findDailyClicks(fromTs, toExclusiveTs);
        var topClickedRow = repo.findTopClickedItems(fromTs, toExclusiveTs, topN);

        // DTO 생성은 서비스에서 끝내서 “ApiResponse 제네릭 불일치”를 원천 차단
        return DashboardOverviewResponseDto.from(
                from,
                to,
                topN,
                summaryRow,
                dailySessionsRow,
                dailyClicksRow,
                topClickedRow
        );
    }
}