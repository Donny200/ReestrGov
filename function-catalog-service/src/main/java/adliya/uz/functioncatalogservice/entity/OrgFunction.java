package adliya.uz.functioncatalogservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "org_functions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrgFunction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(length = 500)
    private String description;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, TranslatedText> nameTranslations = new LinkedHashMap<>();
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, TranslatedText> descriptionTranslations = new LinkedHashMap<>();
    private Long organizationId;
    @Column(length = 500)
    private String requirements;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private FunctionCategory functionCategory;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    @Builder.Default
    private FunctionStatus status = FunctionStatus.DRAFT;
    @Version
    private Long version;
    @Column(unique = true, length = 100)
    private String seedKey;
    @Column(nullable = false, length = 35) @Builder.Default
    private String sourceLanguage = "en";
    @Column(length = 2000)
    private String whoCanUse;
    @Column(length = 4000)
    private String steps;
    @Column(length = 4000)
    private String requiredDocuments;
    @Column(length = 2000)
    private String whereHowToApply;
    @Column(length = 500)
    private String processingTime;
    @Column(length = 500)
    private String fee;
    @Column(length = 500)
    private String officialSourceUrl;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Map<String, TranslatedText>> instructionTranslations = new LinkedHashMap<>();
    private Instant lastVerifiedAt;
    private Long verifiedByUserId;
    @Column(nullable = false) @Builder.Default
    private boolean verificationOutdated = false;

    public Boolean getActive() { return status == FunctionStatus.PUBLISHED; }
    public String getCategory() { return functionCategory == null ? null : functionCategory.getName(); }

    public Map<String, TranslatedText> instructionTranslationsOf(InstructionField field) {
        Map<String, TranslatedText> values = instructionTranslations == null ? null : instructionTranslations.get(field.key());
        return values == null ? Map.of() : values;
    }

    public boolean markVerificationOutdated() {
        if (lastVerifiedAt == null || verificationOutdated) {
            return false;
        }
        verificationOutdated = true;
        return true;
    }

    public VerificationStatus verificationStatus(Instant now) {
        return VerificationStatus.of(lastVerifiedAt, verificationOutdated, now);
    }
}
