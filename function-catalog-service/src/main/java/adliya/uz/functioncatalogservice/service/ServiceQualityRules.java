package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.OfficialSourceUrl;
import adliya.uz.functioncatalogservice.dto.QualityIssue;
import adliya.uz.functioncatalogservice.entity.FunctionStatus;
import adliya.uz.functioncatalogservice.entity.InstructionField;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.entity.QualityIssueType;
import adliya.uz.functioncatalogservice.entity.TranslatedText;
import adliya.uz.functioncatalogservice.entity.VerificationStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public final class ServiceQualityRules {

    private ServiceQualityRules() {}

    public static List<QualityIssue> evaluate(OrgFunction function, Optional<Set<String>> activeLanguages, Instant now) {
        List<QualityIssue> issues = new ArrayList<>();
        if (function.getStatus() == FunctionStatus.DEACTIVATED) {
            return issues;
        }
        verification(function, now).ifPresent(issues::add);
        source(function).ifPresent(issues::add);
        requiredFields(function).ifPresent(issues::add);
        activeLanguages.flatMap(languages -> translations(function, languages)).ifPresent(issues::add);
        return issues;
    }

    static Optional<QualityIssue> verification(OrgFunction function, Instant now) {
        if (function.getStatus() != FunctionStatus.PUBLISHED) {
            return Optional.empty();
        }
        VerificationStatus status = function.verificationStatus(now);
        String reason = switch (status) {
            case VERIFIED -> null;
            case UNVERIFIED -> QualityIssue.NEVER_VERIFIED;
            case DUE -> QualityIssue.RECHECK_DUE;
            case OUTDATED -> QualityIssue.CHANGED_SINCE_VERIFICATION;
        };
        return Optional.ofNullable(reason).map(value -> new QualityIssue(QualityIssueType.VERIFICATION_OVERDUE, value, List.of()));
    }

    static Optional<QualityIssue> source(OrgFunction function) {
        String url = function.getOfficialSourceUrl();
        if (url == null || url.isBlank()) {
            return Optional.of(new QualityIssue(QualityIssueType.SOURCE_MISSING, QualityIssue.MISSING, List.of()));
        }
        return OfficialSourceUrl.isWebLink(url.trim())
                ? Optional.empty()
                : Optional.of(new QualityIssue(QualityIssueType.SOURCE_MISSING, QualityIssue.UNUSABLE, List.of(url)));
    }

    static Optional<QualityIssue> requiredFields(OrgFunction function) {
        List<String> missing = new ArrayList<>();
        if (isBlank(function.getName())) {
            missing.add("name");
        }
        if (isBlank(function.getDescription())) {
            missing.add("description");
        }
        if (function.getOrganizationId() == null) {
            missing.add("organization");
        }
        return missing.isEmpty()
                ? Optional.empty()
                : Optional.of(new QualityIssue(QualityIssueType.INFORMATION_INCOMPLETE, QualityIssue.REQUIRED_FIELDS, missing));
    }

    static Optional<QualityIssue> translations(OrgFunction function, Set<String> activeLanguages) {
        String source = function.getSourceLanguage() == null ? "" : function.getSourceLanguage().toLowerCase(Locale.ROOT);
        List<String> missing = activeLanguages.stream()
                .map(code -> code.toLowerCase(Locale.ROOT))
                .filter(code -> !code.equals(source))
                .filter(code -> !translated(function, code))
                .sorted()
                .toList();
        return missing.isEmpty()
                ? Optional.empty()
                : Optional.of(new QualityIssue(QualityIssueType.TRANSLATIONS_MISSING, QualityIssue.LANGUAGES, missing));
    }

    private static boolean translated(OrgFunction function, String code) {
        if (!present(function.getNameTranslations(), code)) {
            return false;
        }
        if (!isBlank(function.getDescription()) && !present(function.getDescriptionTranslations(), code)) {
            return false;
        }
        for (InstructionField field : InstructionField.values()) {
            if (!isBlank(field.get(function)) && !present(function.instructionTranslationsOf(field), code)) {
                return false;
            }
        }
        return true;
    }

    private static boolean present(Map<String, TranslatedText> translations, String code) {
        TranslatedText value = translations == null ? null : translations.get(code);
        return value != null && !isBlank(value.text());
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
