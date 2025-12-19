// src/main/java/com/team/backend/service/admin/DashboardMonthlyAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardMonthlyResponseDto;
import com.team.backend.api.dto.admin.dashboard.DashboardMonthlyRowResponseDto;
import com.team.backend.repository.admin.DashboardMonthlyJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardMonthlyAdminService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter FILE_TS = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final DashboardMonthlyJdbcRepository repo;

    @Transactional(readOnly = true)
    public DashboardMonthlyResponseDto getMonthly(LocalDate from, LocalDate toExclusive) {
        Range r = toKstRange(from, toExclusive);
        List<DashboardMonthlyJdbcRepository.MonthlyRow> rows = repo.fetchMonthly(r.from(), r.to());

        return DashboardMonthlyResponseDto.builder()
                .rows(rows.stream().map(this::mapRow).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public ExcelExport exportMonthlyExcel(LocalDate from, LocalDate toExclusive) {
        DashboardMonthlyResponseDto dto = getMonthly(from, toExclusive);
        byte[] bytes = buildExcel(dto.rows());

        String filename = "dashboard_monthly_" + LocalDateTime.now(KST).format(FILE_TS) + ".xlsx";
        return new ExcelExport(filename, bytes);
    }

    private DashboardMonthlyRowResponseDto mapRow(DashboardMonthlyJdbcRepository.MonthlyRow r) {
        return DashboardMonthlyRowResponseDto.builder()
                .month(r.month())
                .startedSessions(r.startedSessions())
                .endedSessions(r.endedSessions())
                .errorEvents(r.errorEvents())
                .totalSessionEvents(r.totalSessionEvents())
                .uniqueSessionUsers(r.uniqueSessionUsers())
                .totalClicks(r.totalClicks())
                .uniqueClickUsers(r.uniqueClickUsers())
                .recoEventCount(r.recoEventCount())
                .build();
    }

    private byte[] buildExcel(List<DashboardMonthlyRowResponseDto> rows) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("monthly");

            String[] headers = {
                    "month",
                    "startedSessions",
                    "endedSessions",
                    "errorEvents",
                    "totalSessionEvents",
                    "uniqueSessionUsers",
                    "totalClicks",
                    "uniqueClickUsers",
                    "recoEventCount"
            };

            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell c = header.createCell(i);
                c.setCellValue(headers[i]);
            }

            int rIdx = 1;
            for (var r : rows) {
                Row row = sheet.createRow(rIdx++);
                int c = 0;
                row.createCell(c++).setCellValue(r.month());
                row.createCell(c++).setCellValue(r.startedSessions());
                row.createCell(c++).setCellValue(r.endedSessions());
                row.createCell(c++).setCellValue(r.errorEvents());
                row.createCell(c++).setCellValue(r.totalSessionEvents());
                row.createCell(c++).setCellValue(r.uniqueSessionUsers());
                row.createCell(c++).setCellValue(r.totalClicks());
                row.createCell(c++).setCellValue(r.uniqueClickUsers());
                row.createCell(c++).setCellValue(r.recoEventCount());
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            wb.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("월별 엑셀 생성 실패", e);
        }
    }

    // [from, toExclusive) : KST 기준
    private Range toKstRange(LocalDate from, LocalDate toExclusive) {
        OffsetDateTime fromAt = from.atStartOfDay(KST).toOffsetDateTime();
        OffsetDateTime toAt = toExclusive.atStartOfDay(KST).toOffsetDateTime();
        if (!fromAt.isBefore(toAt)) throw new IllegalArgumentException("from < to 이어야 합니다.");
        return new Range(fromAt, toAt);
    }

    private record Range(OffsetDateTime from, OffsetDateTime to) {}
    public record ExcelExport(String filename, byte[] bytes) {}
}