// src/main/java/com/team/backend/domain/session/SessionRangeResolver.java
package com.team.backend.domain.session;

import com.team.backend.domain.enums.log.SessionRangeType;

import java.time.*;

public class SessionRangeResolver {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    public static SessionDateRange resolve(
            SessionRangeType rangeType,
            OffsetDateTime explicitFrom,
            OffsetDateTime explicitTo
    ) {
        // 1) 커스텀 기간 우선
        if (explicitFrom != null && explicitTo != null) {
            return new SessionDateRange(explicitFrom, explicitTo);
        }

        // 2) 둘 중 하나만 있으면 잘못된 요청이므로 여기선 null 리턴
        if ((explicitFrom == null) != (explicitTo == null)) {
            throw new IllegalArgumentException("from, to는 둘 다 있거나 둘 다 없어야 합니다.");
        }

        // 3) rangeType 없으면 기본값 LAST_7_DAYS
        SessionRangeType type = (rangeType != null)
                ? rangeType
                : SessionRangeType.LAST_7_DAYS;

        LocalDate today = LocalDate.now(ZONE);

        return switch (type) {
            case TODAY -> {
                LocalDate start = today;
                LocalDate end = today.plusDays(1);
                yield toDateRange(start, end);
            }
            case LAST_7_DAYS -> {
                LocalDate start = today.minusDays(6); // 오늘 포함 7일
                LocalDate end = today.plusDays(1);
                yield toDateRange(start, end);
            }
            case LAST_30_DAYS -> {
                LocalDate start = today.minusDays(29);
                LocalDate end = today.plusDays(1);
                yield toDateRange(start, end);
            }
            case THIS_MONTH -> {
                LocalDate start = today.withDayOfMonth(1);
                LocalDate end = start.plusMonths(1);
                yield toDateRange(start, end);
            }
        };
    }

    private static SessionDateRange toDateRange(LocalDate start, LocalDate end) {
        OffsetDateTime from = start.atStartOfDay(ZONE).toOffsetDateTime();
        OffsetDateTime to = end.atStartOfDay(ZONE).toOffsetDateTime();
        return new SessionDateRange(from, to);
    }
}