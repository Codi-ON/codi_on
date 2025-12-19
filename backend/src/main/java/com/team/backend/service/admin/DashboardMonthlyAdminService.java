// src/main/java/com/team/backend/service/admin/DashboardMonthlyAdminService.java
package com.team.backend.service.admin;

import com.team.backend.api.dto.admin.dashboard.DashboardMonthlyResponseDto;
import com.team.backend.api.dto.admin.dashboard.DashboardMonthlyRowResponseDto;
import com.team.backend.common.time.TimeRanges;
import com.team.backend.repository.admin.DashboardMonthlyJdbcRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardMonthlyAdminService {

    private static final String REGION = "Seoul";
    private static final DateTimeFormatter FILE_TS = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final DashboardMonthlyJdbcRepository repo;

    @Transactional
    public DashboardMonthlyResponseDto getMonthly(YearMonth fromMonth, YearMonth toMonth, int topN) {
        if (fromMonth == null || toMonth == null) throw new IllegalArgumentException("fromMonth/toMonth는 필수입니다.");
        if (fromMonth.isAfter(toMonth)) throw new IllegalArgumentException("fromMonth는 toMonth보다 클 수 없습니다.");

        // 1) 월별 스냅샷 upsert + topN 스냅샷 refresh
        var cursor = fromMonth;
        while (!cursor.isAfter(toMonth)) {
            var range = TimeRanges.month(cursor);
            LocalDate monthStart = cursor.atDay(1);

            repo.upsertMonthlyKpi(monthStart, REGION, range.fromInclusive(), range.toExclusive());
            repo.refreshMonthlyTopClicked(monthStart, REGION, range.fromInclusive(), range.toExclusive(), topN);

            cursor = cursor.plusMonths(1);
        }

        // 2) rows 조회
        LocalDate fromStart = fromMonth.atDay(1);
        LocalDate toStart   = toMonth.atDay(1);

        List<DashboardMonthlyRowResponseDto> baseRows = repo.fetchMonthlyRows(fromStart, toStart, REGION);

        // 3) topClicked month별 그룹핑 -> row에 붙이기
        var topClickedRows = repo.fetchMonthlyTopClicked(fromStart, toStart, REGION, topN);
        Map<String, List<DashboardMonthlyRowResponseDto.TopClickedItem>> topMap = new HashMap<>();

        for (var r : topClickedRows) {
            topMap.computeIfAbsent(r.month(), k -> new ArrayList<>()).add(
                    new DashboardMonthlyRowResponseDto.TopClickedItem(
                            r.rank(),
                            r.clothingItemId(),
                            r.name(),
                            r.clickCount(),
                            r.clickRatio()
                    )
            );
        }

        List<DashboardMonthlyRowResponseDto> rows = baseRows.stream()
                .map(r -> new DashboardMonthlyRowResponseDto(
                        r.month(),
                        r.totalSessionEvents(),
                        r.totalSessions(),
                        r.uniqueUsers(),
                        r.avgSessionsPerUser(),
                        r.totalClicks(),
                        r.totalRecoEvents(),
                        r.errorEvents(),
                        r.startedSessions(),
                        r.endedSessions(),
                        r.sessionEndRate(),
                        r.recoEmpty(),
                        r.recoGenerated(),
                        r.recoEmptyRate(),
                        topMap.getOrDefault(r.month(), List.of())
                ))
                .toList();

        // 4) meta
        var generatedAt = repo.getLatestGeneratedAt(fromStart, toStart, REGION);
        if (generatedAt == null) generatedAt = TimeRanges.nowKst();

        return new DashboardMonthlyResponseDto(
                new DashboardMonthlyResponseDto.Meta(REGION, generatedAt, TimeRanges.timezone(), topN),
                new DashboardMonthlyResponseDto.Range(fromMonth.toString(), toMonth.toString()),
                rows
        );
    }

    @Transactional
    public ExcelExport exportMonthlyExcel(YearMonth fromMonth, YearMonth toMonth, int topN) {
        DashboardMonthlyResponseDto dto = getMonthly(fromMonth, toMonth, topN);

        byte[] bytes = buildExcel(dto);
        String ts = dto.meta().generatedAt().toLocalDateTime().format(FILE_TS);
        String filename = "monthly_kpi_" + dto.range().fromMonth() + "_to_" + dto.range().toMonth() + "_" + ts + ".xlsx";

        return new ExcelExport(
                filename,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                bytes
        );
    }

    private byte[] buildExcel(DashboardMonthlyResponseDto dto) {
        var rows = dto.rows();

        String[] headers = {
                "month",
                "startedSessions", "endedSessions", "sessionEndRate",
                "errorEvents",
                "totalSessionEvents", "totalSessions", "uniqueUsers", "avgSessionsPerUser",
                "totalClicks", "totalRecoEvents",
                "recoEmpty", "recoGenerated", "recoEmptyRate"
        };

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Sheet 1) KPI
            var sheet = wb.createSheet("monthly_kpi");
            Row h = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) h.createCell(i).setCellValue(headers[i]);

            int rIdx = 1;
            for (var r : rows) {
                Row row = sheet.createRow(rIdx++);
                int c = 0;

                row.createCell(c++).setCellValue(r.month());

                row.createCell(c++).setCellValue(r.startedSessions());
                row.createCell(c++).setCellValue(r.endedSessions());
                row.createCell(c++).setCellValue(r.sessionEndRate());

                row.createCell(c++).setCellValue(r.errorEvents());

                row.createCell(c++).setCellValue(r.totalSessionEvents());
                row.createCell(c++).setCellValue(r.totalSessions());
                row.createCell(c++).setCellValue(r.uniqueUsers());
                row.createCell(c++).setCellValue(r.avgSessionsPerUser());

                row.createCell(c++).setCellValue(r.totalClicks());
                row.createCell(c++).setCellValue(r.totalRecoEvents());

                row.createCell(c++).setCellValue(r.recoEmpty());
                row.createCell(c++).setCellValue(r.recoGenerated());
                row.createCell(c++).setCellValue(r.recoEmptyRate());
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            // Sheet 2) Top Clicked
            var sheet2 = wb.createSheet("top_clicked");
            String[] headers2 = {"month", "rank", "clothingItemId", "name", "clickCount", "clickRatio"};
            Row h2 = sheet2.createRow(0);
            for (int i = 0; i < headers2.length; i++) h2.createCell(i).setCellValue(headers2[i]);

            int r2 = 1;
            for (var r : rows) {
                for (var item : r.topClickedItems()) {
                    Row row = sheet2.createRow(r2++);
                    int c = 0;
                    row.createCell(c++).setCellValue(r.month());
                    row.createCell(c++).setCellValue(item.rank());
                    row.createCell(c++).setCellValue(item.clothingItemId());
                    row.createCell(c++).setCellValue(item.name());
                    row.createCell(c++).setCellValue(item.clickCount());
                    row.createCell(c++).setCellValue(item.clickRatio());
                }
            }
            for (int i = 0; i < headers2.length; i++) sheet2.autoSizeColumn(i);

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("엑셀 생성 실패", e);
        }
    }

    public record ExcelExport(String filename, String contentType, byte[] bytes) {}
}