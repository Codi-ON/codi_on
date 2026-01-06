// src/main/java/com/team/backend/service/admin/DashboardOverviewAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardOverviewResponseDto;
import com.team.backend.repository.admin.DashboardOverviewJdbcRepository;
import com.team.backend.repository.admin.DashboardRetentionJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardOverviewAdminService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final DashboardOverviewJdbcRepository overviewRepo;
    private final DashboardRetentionJdbcRepository retentionRepo;

    /**
     * from/to: inclusive (컨트롤러에서 받는 그대로)
     * 내부 집계:
     * - overview: [from, to+1day)
     * - retention: d+1 체크 때문에 [from, (to+1day)+1day) 까지 필요
     */
    public DashboardOverviewResponseDto getOverview(LocalDate fromInclusive, LocalDate toInclusive, int topN) {
        if (fromInclusive == null || toInclusive == null) throw new IllegalArgumentException("from/to는 필수입니다.");
        if (fromInclusive.isAfter(toInclusive)) throw new IllegalArgumentException("from은 to보다 클 수 없습니다.");

        int resolvedTopN = Math.min(Math.max(topN, 1), 50);

        LocalDate toExclusiveDate = toInclusive.plusDays(1);

        OffsetDateTime fromKst = fromInclusive.atStartOfDay(KST).toOffsetDateTime();
        OffsetDateTime toExclusiveKst = toExclusiveDate.atStartOfDay(KST).toOffsetDateTime();

        // 1) Overview
        var summaryRow = overviewRepo.findSummary(fromKst, toExclusiveKst);
        var dailySessionsRow = overviewRepo.findDailySessions(fromKst, toExclusiveKst);
        var dailyClicksRow = overviewRepo.findDailyClicks(fromKst, toExclusiveKst);
        var topClickedRow = overviewRepo.findTopClickedItems(fromKst, toExclusiveKst, resolvedTopN);

        // 2) D1 Retention (요약 + 트렌드)
        OffsetDateTime toExclusivePlus1 = toExclusiveKst.plusDays(1);

        var d1 = retentionRepo.fetchD1Retention(fromKst, toExclusivePlus1);
        long eligible = (d1 == null) ? 0 : d1.eligibleUsers();
        long retained = (d1 == null) ? 0 : d1.retainedUsers();
        double d1Rate = (eligible == 0) ? 0.0 : round2(retained * 100.0 / eligible);

        var d1Summary = new DashboardOverviewResponseDto.D1RetentionSummary(eligible, retained, d1Rate);

        List<DashboardOverviewResponseDto.DailyD1Retention> d1Trend =
                retentionRepo.fetchD1Trend(fromKst, toExclusivePlus1).stream()
                        .map(r -> new DashboardOverviewResponseDto.DailyD1Retention(
                                r.date(),
                                r.baseUsers(),
                                r.retainedUsers(),
                                r.d1RetentionRate()
                        ))
                        .toList();

        // 3) DTO 조립 (네 from() 시그니처 그대로)
        return DashboardOverviewResponseDto.from(
                fromInclusive,
                toInclusive,
                resolvedTopN,
                summaryRow,
                dailySessionsRow,
                dailyClicksRow,
                topClickedRow,
                d1Summary,
                d1Trend
        );
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}