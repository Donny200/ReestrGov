package adliya.uz.functioncatalogservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
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
    // Drafts may await assignment; review/publication require an existing organization.
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

    // Preserve the public response contract without a second persisted state/category.
    public Boolean getActive() { return status == FunctionStatus.PUBLISHED; }
    public String getCategory() { return functionCategory == null ? null : functionCategory.getName(); }
}
