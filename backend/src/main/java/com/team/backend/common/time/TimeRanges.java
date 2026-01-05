// src/main/java/com/team/backend/common/time/TimeRanges.java
package com.team.backend.common.time;

import java.time.*;
import java.time.format.DateTimeFormatter;

public final class TimeRanges {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter YM_COMPACT = DateTimeFormatter.ofPattern("yyyyMM");

    private TimeRanges() {
    }

    public static Range kstDayRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) throw new IllegalArgumentException("from/to는 필수입니다.");
        if (from.isAfter(to)) throw new IllegalArgumentException("from은 to보다 클 수 없습니다.");

        ZonedDateTime fromZ = from.atStartOfDay(KST);
        ZonedDateTime toZ = to.plusDays(1).atStartOfDay(KST); // [from, to+1)
        return new Range(fromZ.toOffsetDateTime(), toZ.toOffsetDateTime());
    }

    public static Range month(YearMonth ym) {
        if (ym == null) throw new IllegalArgumentException("ym은 필수입니다.");

        ZonedDateTime fromZ = ym.atDay(1).atStartOfDay(KST);
        ZonedDateTime toZ = ym.plusMonths(1).atDay(1).atStartOfDay(KST);
        return new Range(fromZ.toOffsetDateTime(), toZ.toOffsetDateTime());
    }

    public static OffsetDateTime nowKst() {
        return ZonedDateTime.now(KST).toOffsetDateTime();
    }

    public static String timezone() {
        return KST.getId();
    }

    public static YearMonth parseYearMonthLenient(String raw) {
        return parseYearMonthLenient(raw, "month");
    }

    // =========================
    // YearMonth parsing (lenient)
    // =========================

    public static YearMonth parseYearMonthLenient(String raw, String fieldName) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(fieldName + "는 필수입니다. (예: 2025-12)");
        }

        String s = raw.trim();

        if (s.matches("\\d{4}/\\d{2}")) s = s.replace('/', '-');
        if (s.matches("\\d{4}-\\d{2}-\\d{2}")) s = s.substring(0, 7);
        if (s.matches("\\d{8}")) s = s.substring(0, 6);

        try {
            if (s.matches("\\d{4}-\\d{2}")) return YearMonth.parse(s);
            if (s.matches("\\d{6}")) return YearMonth.parse(s, YM_COMPACT);
        } catch (Exception ignore) {
        }

        throw new IllegalArgumentException(
                fieldName + " 형식이 올바르지 않습니다. (허용: YYYY-MM, YYYY/MM, YYYY-MM-DD, YYYYMM) value=" + raw
        );
    }

    public static LocalDate todayKst() {
        return nowKst().toLocalDate();
    }

    public static String ymCompact(YearMonth ym) {
        if (ym == null) throw new IllegalArgumentException("ym은 필수입니다.");
        return ym.format(YM_COMPACT);
    }

    public static String ymCompact(LocalDate date) {
        if (date == null) throw new IllegalArgumentException("date는 필수입니다.");
        return ymCompact(YearMonth.from(date));
    }

    // created_at >= fromInclusive AND created_at < toExclusive
    public record Range(OffsetDateTime fromInclusive, OffsetDateTime toExclusive) {
    }
}