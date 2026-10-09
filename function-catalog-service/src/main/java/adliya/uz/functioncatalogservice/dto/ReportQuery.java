package adliya.uz.functioncatalogservice.dto;

import adliya.uz.functioncatalogservice.entity.ReportEntityType;
import adliya.uz.functioncatalogservice.entity.ReportStatus;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

public record ReportQuery(Set<ReportStatus> statuses, ReportEntityType entityType, Long entityId) {

    public static ReportQuery of(String status, ReportEntityType entityType, Long entityId) {
        String value = status == null || status.isBlank() ? "OPEN" : status.trim().toUpperCase(Locale.ROOT);
        Set<ReportStatus> statuses = switch (value) {
            case "OPEN" -> ReportStatus.OPEN;
            case "ALL" -> EnumSet.allOf(ReportStatus.class);
            default -> EnumSet.of(parse(value));
        };
        return new ReportQuery(statuses, entityType, entityId);
    }

    private static ReportStatus parse(String value) {
        try {
            return ReportStatus.valueOf(value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unknown report status: " + value);
        }
    }
}
