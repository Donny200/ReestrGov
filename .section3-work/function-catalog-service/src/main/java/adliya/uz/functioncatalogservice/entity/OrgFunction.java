package adliya.uz.functioncatalogservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "org_functions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgFunction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, TranslatedText> nameTranslations = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, TranslatedText> descriptionTranslations = new LinkedHashMap<>();

    @Column(nullable = false)
    private Long organizationId;

    @Column(length = 500)
    private String requirements;

    @Column(length = 100)
    private String category;

}
