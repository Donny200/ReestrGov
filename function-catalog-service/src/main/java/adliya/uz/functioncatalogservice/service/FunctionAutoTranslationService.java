package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.AutoTranslateRequest;
import adliya.uz.functioncatalogservice.entity.*;
import adliya.uz.functioncatalogservice.exception.*;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import adliya.uz.functioncatalogservice.security.CatalogAccess;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FunctionAutoTranslationService {
    private final OrgFunctionRepository functions;
    private final CatalogAccess access;
    private final TranslationClient translator;
    private final AuditWriter audit;
    private final PlatformTransactionManager transactions;
    @PersistenceContext private EntityManager entityManager;

    public boolean available() { return translator.isAvailable(); }

    public OrgFunction translate(Long id, AutoTranslateRequest request) {
        access.requirePermission("FUNCTIONS_EDIT");
        access.requirePermission("FUNCTIONS_TRANSLATIONS_EDIT");
        var transaction = new TransactionTemplate(transactions);
        Snapshot snapshot = Objects.requireNonNull(transaction.execute(status -> {
            var function = scopedDraft(id);
            return new Snapshot(function.getVersion(), function.getName(), function.getDescription(), function.getSourceLanguage(),
                    new LinkedHashMap<>(function.getNameTranslations()), new LinkedHashMap<>(function.getDescriptionTranslations()));
        }));
        if (!available()) throw new TranslationUnavailableException(HttpStatus.SERVICE_UNAVAILABLE, "Automatic translation is not configured");

        var targets = request.languages().stream().map(code -> code.toLowerCase(Locale.ROOT)).distinct()
                .filter(code -> !code.equals(snapshot.language())).toList();
        // Network calls run outside DB transactions. Manual entries are never overwritten.
        var names = generate(snapshot.name(), snapshot.names(), targets, snapshot.language(), request.overwriteMachine(), 150);
        var descriptions = generate(snapshot.description(), snapshot.descriptions(), targets, snapshot.language(), request.overwriteMachine(), 500);

        return Objects.requireNonNull(transaction.execute(status -> {
            var function = functions.findById(id).orElseThrow(() -> new NoSuchElementException("Function not found"));
            entityManager.refresh(function); // Also defeats a stale OpenEntityManagerInView first-level cache.
            access.requireOrganization(function.getOrganizationId());
            if (!Objects.equals(snapshot.version(), function.getVersion()) || function.getStatus() != FunctionStatus.DRAFT)
                throw new WorkflowConflictException("Card changed while translating; reload and retry");
            if (!names.isEmpty() || !descriptions.isEmpty()) {
                var mergedNames = new LinkedHashMap<>(function.getNameTranslations());
                var mergedDescriptions = new LinkedHashMap<>(function.getDescriptionTranslations());
                names.forEach((code, text) -> mergedNames.put(code, new TranslatedText(text, TranslatedText.MACHINE)));
                descriptions.forEach((code, text) -> mergedDescriptions.put(code, new TranslatedText(text, TranslatedText.MACHINE)));
                function.setNameTranslations(mergedNames);
                function.setDescriptionTranslations(mergedDescriptions);
                functions.saveAndFlush(function);
                audit.function(function, AuditAction.TRANSLATION_EDIT, "Machine translation: " + String.join(", ", targets));
            }
            return function;
        }));
    }

    private OrgFunction scopedDraft(Long id) {
        var function = functions.findById(id).orElseThrow(() -> new NoSuchElementException("Function not found"));
        access.requireOrganization(function.getOrganizationId());
        if (function.getStatus() != FunctionStatus.DRAFT) throw new WorkflowConflictException("Translation requires DRAFT");
        return function;
    }

    private Map<String, String> generate(String text, Map<String, TranslatedText> existing, List<String> targets,
                                         String source, boolean overwrite, int maxLength) {
        if (text == null || text.isBlank()) return Map.of();
        var needed = targets.stream().filter(code -> {
            var value = existing.get(code);
            return value == null || value.text() == null || value.text().isBlank()
                    || (overwrite && TranslatedText.MACHINE.equals(value.source()));
        }).toList();
        if (needed.isEmpty()) return Map.of();
        var result = translator.translateRequired(text, source, needed);
        var checked = new LinkedHashMap<String, String>();
        for (String code : needed) {
            String translated = result.get(code);
            if (translated == null || translated.isBlank() || translated.length() > maxLength)
                throw new TranslationUnavailableException(HttpStatus.BAD_GATEWAY, "Translation is incomplete or too long; try a manual translation");
            checked.put(code, translated);
        }
        return checked;
    }

    private record Snapshot(Long version, String name, String description, String language,
                            Map<String, TranslatedText> names, Map<String, TranslatedText> descriptions) {}
}
