package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.entity.EngagementEventType;
import adliya.uz.functioncatalogservice.security.OrganizationScope;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface EngagementStatistics {

    Map<EngagementEventType, Long> totals(Filter filter, LocalDate from, LocalDate to);

    List<DailyCount> daily(Filter filter, LocalDate from, LocalDate to);

    List<SubjectCount> bySubject(Filter filter, LocalDate from, LocalDate to);

    record Filter(OrganizationScope scope, Long categoryId) {}

    record DailyCount(LocalDate day, EngagementEventType type, long count) {}

    record SubjectCount(Long functionId, Long organizationId, EngagementEventType type, long count) {}
}
