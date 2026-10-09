package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.config.ReminderProperties;
import adliya.uz.functioncatalogservice.dto.QualityIssue;
import adliya.uz.functioncatalogservice.dto.QualityReminderResponse;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.entity.QualityIssueType;
import adliya.uz.functioncatalogservice.entity.QualityReminder;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import adliya.uz.functioncatalogservice.repository.QualityReminderRepository;
import adliya.uz.functioncatalogservice.security.CatalogAccess;
import adliya.uz.functioncatalogservice.security.OrganizationScope;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QualityReminderService {

    public static final int LIST_LIMIT = 200;

    private final QualityReminderRepository reminders;
    private final OrgFunctionRepository functions;
    private final ActiveLanguageClient languages;
    private final CatalogAccess access;
    private final AuditWriter audit;
    private final ReminderProperties properties;

    @Transactional
    public ScanResult scan(Instant now) {
        Optional<Set<String>> active = languages.activeLanguageCodes();
        Map<Key, QualityReminder> open = new HashMap<>();
        reminders.findAllByResolvedAtIsNull().forEach(reminder -> open.put(Key.of(reminder), reminder));
        Set<Key> current = new HashSet<>();
        int created = 0;
        int renotified = 0;
        for (OrgFunction function : functions.findAll()) {
            if (function.getOrganizationId() == null) {
                continue;
            }
            for (QualityIssue issue : ServiceQualityRules.evaluate(function, active, now)) {
                Key key = new Key(function.getId(), issue.type());
                current.add(key);
                QualityReminder reminder = open.get(key);
                if (reminder == null) {
                    reminders.save(QualityReminder.builder().functionId(function.getId())
                            .organizationId(function.getOrganizationId()).issue(issue.type())
                            .detectedAt(now).notifiedAt(now).build());
                    created++;
                    continue;
                }
                reminder.setOrganizationId(function.getOrganizationId());
                if (snoozeExpired(reminder, now)) {
                    reminder.setAcknowledgedAt(null);
                    reminder.setAcknowledgedByUserId(null);
                    reminder.setNotifiedAt(now);
                    renotified++;
                }
            }
        }
        int resolved = 0;
        for (Map.Entry<Key, QualityReminder> entry : open.entrySet()) {
            boolean unknown = entry.getKey().issue() == QualityIssueType.TRANSLATIONS_MISSING && active.isEmpty();
            if (!current.contains(entry.getKey()) && !unknown) {
                entry.getValue().setResolvedAt(now);
                resolved++;
            }
        }
        return new ScanResult(created, renotified, resolved);
    }

    @Transactional(readOnly = true)
    public List<QualityReminderResponse> active(Long organizationId, Long categoryId) {
        OrganizationScope scope = access.scope(organizationId);
        if (scope.empty()) {
            return List.of();
        }
        List<QualityReminder> found = scope.allOrganizations()
                ? reminders.findAllByResolvedAtIsNullAndAcknowledgedAtIsNullOrderByNotifiedAtDescIdDesc()
                : reminders.findAllByResolvedAtIsNullAndAcknowledgedAtIsNullAndOrganizationIdInOrderByNotifiedAtDescIdDesc(
                        scope.organizationIds());
        Set<Long> functionIds = found.stream().map(QualityReminder::getFunctionId).collect(Collectors.toSet());
        Map<Long, OrgFunction> cards = functions.findAllById(functionIds).stream()
                .collect(Collectors.toMap(OrgFunction::getId, Function.identity()));
        return found.stream()
                .filter(reminder -> categoryId == null || inCategory(cards.get(reminder.getFunctionId()), categoryId))
                .limit(LIST_LIMIT)
                .map(reminder -> QualityReminderResponse.of(reminder, cards.get(reminder.getFunctionId())))
                .toList();
    }

    public long activeCount(OrganizationScope scope, Set<Long> functionIds) {
        if (scope.empty() || functionIds.isEmpty()) {
            return 0;
        }
        List<QualityReminder> found = scope.allOrganizations()
                ? reminders.findAllByResolvedAtIsNullAndAcknowledgedAtIsNullOrderByNotifiedAtDescIdDesc()
                : reminders.findAllByResolvedAtIsNullAndAcknowledgedAtIsNullAndOrganizationIdInOrderByNotifiedAtDescIdDesc(
                        scope.organizationIds());
        return found.stream().filter(reminder -> functionIds.contains(reminder.getFunctionId())).count();
    }

    @Transactional
    public QualityReminder acknowledge(Long id) {
        QualityReminder reminder = reminders.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Reminder not found: " + id));
        access.scope(reminder.getOrganizationId());
        if (reminder.getResolvedAt() == null && reminder.getAcknowledgedAt() == null) {
            reminder.setAcknowledgedAt(Instant.now());
            reminder.setAcknowledgedByUserId(audit.actor().id());
        }
        return reminder;
    }

    private boolean snoozeExpired(QualityReminder reminder, Instant now) {
        return reminder.getAcknowledgedAt() != null
                && !reminder.getAcknowledgedAt().plus(properties.getRenotifyAfter()).isAfter(now);
    }

    private static boolean inCategory(OrgFunction card, Long categoryId) {
        return card != null && card.getFunctionCategory() != null && categoryId.equals(card.getFunctionCategory().getId());
    }

    public record ScanResult(int created, int renotified, int resolved) {}

    private record Key(Long functionId, QualityIssueType issue) {
        static Key of(QualityReminder reminder) {
            return new Key(reminder.getFunctionId(), reminder.getIssue());
        }
    }
}
