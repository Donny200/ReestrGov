package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.security.OrganizationScope;

import java.time.LocalDate;
import java.util.List;

public interface FeedbackStatistics {

    Totals totals(Filter filter, LocalDate from, LocalDate to);

    List<ServiceTotals> byService(Filter filter, LocalDate from, LocalDate to);

    record Filter(OrganizationScope scope, Long categoryId) {}

    record Totals(long helpful, long notHelpful) {
        public static Totals none() { return new Totals(0, 0); }
    }

    record ServiceTotals(Long functionId, Long organizationId, long helpful, long notHelpful) {}
}
