package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.dto.EngagementReport;
import adliya.uz.functioncatalogservice.service.EngagementInsightsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ORG_ANALYTICS_VIEW')")
@Tag(name = "Organization analytics", description = "Organization dashboard data scoped to the caller's organizations. "
        + "Engagement figures describe interest in catalog information only; they are not applications or completed services.")
public class OrganizationInsightsController {

    private final EngagementInsightsService engagement;

    @GetMapping("/engagement")
    @Operation(summary = "Catalog engagement for a period",
            description = "Daily aggregates of public catalog views and link clicks in the Asia/Tashkent calendar, "
                    + "compared with the preceding period of equal length.")
    public EngagementReport engagement(@RequestParam(required = false) Long organizationId,
                                       @RequestParam(required = false) Long categoryId,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                       @RequestParam(required = false) EngagementReport.Granularity granularity) {
        return engagement.report(organizationId, categoryId, from, to, granularity);
    }
}
