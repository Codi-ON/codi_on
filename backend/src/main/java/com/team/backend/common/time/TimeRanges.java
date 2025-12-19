// src/main/java/com/team/backend/common/time/TimeRanges.java
package com.team.backend.common.time;

import java.time.*;
import java.time.format.DateTimeFormatter;

public final class TimeRanges {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter YM_COMPACT = DateTimeFormatter.ofPattern("yyyyMM");

    private TimeRanges() {}

    // created_at >= fromInclusive AND created_at < toExclusive
    public record Range(OffsetDateTime fromInclusive, OffsetDateTime toExclusive) {}

    public static Range kstDayRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) throw new IllegalArgumentException("from/to는 필수입니다.");
        if (from.isAfter(to)) throw new IllegalArgumentException("from은 to보다 클 수 없습니다.");

        ZonedDateTime fromZ = from.atStartOfDay(KST);
        ZonedDateTime toZ   = to.plusDays(1).atStartOfDay(KST); // [from, to+1)
        return new Range(fromZ.toOffsetDateTime(), toZ.toOffsetDateTime());
    }

    /**
     * 월 기준 [monthStart 00:00 KST, nextMonthStart 00:00 KST)
     * - 예: 2025-12 => from=2025-12-01T00:00+09:00, to=2026-01-01T00:00+09:00
     */
    public static Range month(YearMonth ym) {
        if (ym == null) throw new IllegalArgumentException("ym은 필수입니다.");

        ZonedDateTime fromZ = ym.atDay(1).atStartOfDay(KST);
        ZonedDateTime toZ   = ym.plusMonths(1).atDay(1).atStartOfDay(KST);
        return new Range(fromZ.toOffsetDateTime(), toZ.toOffsetDateTime());
    }

    public static OffsetDateTime nowKst() {
        return ZonedDateTime.now(KST).toOffsetDateTime();
    }

    public static String timezone() {
        return KST.getId();
    }

    // =========================
    // YearMonth parsing (lenient)
    // =========================

    /** 옵션 B: 컨트롤러가 1개 인자로 호출 가능하게 오버로드 */
    public static YearMonth parseYearMonthLenient(String raw) {
        return parseYearMonthLenient(raw, "month");
    }

    /** 실제 파싱 로직(에러 메시지 강화를 위해 fieldName 유지) */
    public static YearMonth parseYearMonthLenient(String raw, String fieldName) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(fieldName + "는 필수입니다. (예: 2025-12)");
        }

        String s = raw.trim();

        // 1) "2025/12" -> "2025-12"
        if (s.matches("\\d{4}/\\d{2}")) s = s.replace('/', '-');

        // 2) "2025-12-01" 같은 date 입력은 앞의 "YYYY-MM"만 취함
        if (s.matches("\\d{4}-\\d{2}-\\d{2}")) s = s.substring(0, 7);

        // 3) "202512" / "20251201" -> "yyyyMM"으로 처리(뒤는 버림)
        if (s.matches("\\d{8}")) s = s.substring(0, 6);

        try {
            if (s.matches("\\d{4}-\\d{2}")) {
                return YearMonth.parse(s); // ISO "YYYY-MM"
            }
            if (s.matches("\\d{6}")) {
                return YearMonth.parse(s, YM_COMPACT); // "yyyyMM"
            }
        } catch (Exception ignore) {
            // 아래에서 통합 에러로 던짐
        }

        throw new IllegalArgumentException(
                fieldName + " 형식이 올바르지 않습니다. (허용: YYYY-MM, YYYY/MM, YYYY-MM-DD, YYYYMM) value=" + raw
        );
    }
}