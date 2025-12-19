// src/main/java/com/team/backend/common/excel/ExcelExport.java
package com.team.backend.common;

public record ExcelExport(
        String filename,
        byte[] bytes,
        String contentType
) {
    public static ExcelExport xlsx(String filename, byte[] bytes) {
        return new ExcelExport(filename, bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
}