package adliya.uz.referenceservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "interface_translations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_interface_translation_language_key",
                columnNames = {"language_code", "translation_key"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterfaceTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "language_code", nullable = false, length = 255)
    private String languageCode;

    @Column(name = "translation_key", nullable = false, length = 150)
    private String translationKey;

    @Column(name = "translation_value", nullable = false, columnDefinition = "TEXT")
    private String translationValue;
}
