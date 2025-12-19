// src/main/java/com/team/backend/common/time/TimeRanges.java
package com.team.backend.common.time;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public final class TimeRanges {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private TimeRanges() {}

    // created_at >= fromInclusive AND created_at < toExclusive
    public record Range(OffsetDateTime fromInclusive, OffsetDateTime toExclusive) {}

    public static Range kstDayRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) throw new IllegalArgumentException("from/to는 필수입니다.");
        if (from.isAfter(to)) throw new IllegalArgumentException("from은 to보다 클 수 없습니다.");

        OffsetDateTime fromAt = from.atStartOfDay(KST).toOffsetDateTime();
        OffsetDateTime toAt   = to.plusDays(1).atStartOfDay(KST).toOffsetDateTime(); // [from, to+1)
        return new Range(fromAt, toAt);
    }

    public static OffsetDateTime nowKst() {
        return ZonedDateTime.now(KST).toOffsetDateTime();
    }

    public static String timezone() {
        return "Asia/Seoul";
    }
}

//