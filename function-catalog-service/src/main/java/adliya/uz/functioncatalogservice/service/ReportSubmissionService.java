package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.config.ReportProperties;
import adliya.uz.functioncatalogservice.dto.SubmitReportRequest;
import adliya.uz.functioncatalogservice.entity.FunctionStatus;
import adliya.uz.functioncatalogservice.entity.InformationReport;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.entity.ReportEntityType;
import adliya.uz.functioncatalogservice.entity.ReportStatus;
import adliya.uz.functioncatalogservice.exception.RateLimitExceededException;
import adliya.uz.functioncatalogservice.repository.InformationReportRepository;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ReportSubmissionService {

    private static final Duration DEDUPLICATION_WINDOW = Duration.ofDays(1);
    private static final int MIN_DESCRIPTION_LENGTH = 10;
    private static final int MAX_LINKS = 3;
    private static final int LABEL_MAX_LENGTH = 150;
    private static final Pattern LINE_BREAKS = Pattern.compile("\\r\\n?");
    private static final Pattern CONTROL_CHARACTERS = Pattern.compile("[\\p{Cntrl}&&[^\\n]]");
    private static final Pattern HORIZONTAL_SPACE = Pattern.compile("[\\h\\x0B\\f]+");
    private static final Pattern SPACE_AROUND_BREAKS = Pattern.compile(" ?\\n ?");
    private static final Pattern EXCESS_BLANK_LINES = Pattern.compile("\\n{3,}");
    private static final Pattern LETTER_OR_DIGIT = Pattern.compile("[\\p{L}\\p{N}]");
    private static final Pattern LINK = Pattern.compile("(?i)(https?://|www\\.)");

    private final ReportRateLimiter rateLimiter;
    private final ReportProperties properties;
    private final OrgFunctionRepository functions;
    private final IdentityOrganizationClient organizations;
    private final InformationReportRepository reports;
    private final AuditWriter audit;
    private final TransactionTemplate transaction;

    public void submit(SubmitReportRequest request, String clientAddress) {
        rateLimiter.acquire(clientAddress);
        if (request.website() != null && !request.website().isBlank()) {
            return;
        }
        if (!request.category().appliesTo(request.entityType())) {
            throw new IllegalArgumentException("Category " + request.category() + " does not apply to " + request.entityType());
        }
        String description = normalizedDescription(request.description());
        Target target = resolve(request.entityType(), request.entityId());
        transaction.executeWithoutResult(status -> store(request, target, description));
    }

    private void store(SubmitReportRequest request, Target target, String description) {
        Instant now = Instant.now();
        Instant since = now.minus(DEDUPLICATION_WINDOW);
        if (reports.countByEntityTypeAndEntityIdAndCreatedAtAfter(request.entityType(), request.entityId(), since)
                >= properties.getPerEntityDailyLimit()) {
            throw new RateLimitExceededException(DEDUPLICATION_WINDOW);
        }
        if (reports.existsByEntityTypeAndEntityIdAndDescriptionAndStatusInAndCreatedAtAfter(
                request.entityType(), request.entityId(), description, ReportStatus.OPEN, since)) {
            return;
        }
        InformationReport report = reports.save(InformationReport.builder()
                .entityType(request.entityType())
                .entityId(request.entityId())
                .entityLabel(truncate(target.label()))
                .organizationId(target.organizationId())
                .category(request.category())
                .description(description)
                .contact(blankToNull(request.contact()))
                .language(normalizedLanguage(request.language()))
                .status(ReportStatus.NEW)
                .createdAt(now)
                .updatedAt(now)
                .build());
        audit.reportReceived(report);
    }

    private Target resolve(ReportEntityType type, Long id) {
        if (type == ReportEntityType.FUNCTION) {
            OrgFunction function = functions.findByIdAndStatus(id, FunctionStatus.PUBLISHED)
                    .orElseThrow(() -> new NoSuchElementException("Service not found: " + id));
            return new Target(function.getName(), function.getOrganizationId());
        }
        IdentityOrganizationClient.PublicOrganization organization = organizations.requirePublic(id);
        return new Target(organization.name() == null ? "#" + id : organization.name(), organization.id());
    }

    private static String normalizedDescription(String raw) {
        String value = LINE_BREAKS.matcher(raw).replaceAll("\n");
        value = HORIZONTAL_SPACE.matcher(CONTROL_CHARACTERS.matcher(value).replaceAll(" ")).replaceAll(" ");
        value = EXCESS_BLANK_LINES.matcher(SPACE_AROUND_BREAKS.matcher(value).replaceAll("\n")).replaceAll("\n\n").strip();
        if (value.length() < MIN_DESCRIPTION_LENGTH || !LETTER_OR_DIGIT.matcher(value).find()) {
            throw new IllegalArgumentException("Describe the problem in at least " + MIN_DESCRIPTION_LENGTH + " characters");
        }
        if (LINK.matcher(value).results().count() > MAX_LINKS) {
            throw new IllegalArgumentException("A report may contain at most " + MAX_LINKS + " links");
        }
        return value;
    }

    private static String normalizedLanguage(String value) {
        String language = blankToNull(value);
        return language == null ? null : language.toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String truncate(String value) {
        return value.length() <= LABEL_MAX_LENGTH ? value : value.substring(0, LABEL_MAX_LENGTH);
    }

    private record Target(String label, Long organizationId) {}
}
