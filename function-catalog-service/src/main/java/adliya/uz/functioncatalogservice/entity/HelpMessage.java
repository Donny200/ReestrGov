package adliya.uz.functioncatalogservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "help_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HelpMessage {

    public enum Author { VISITOR, STAFF }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long conversationId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10)
    private Author author;
    private Long staffUserId;
    /** Staff e-mail at the time of the reply; shown to colleagues only, never to the visitor. */
    @Column(length = 320)
    private String staffLabel;
    @Column(nullable = false, length = 2000)
    private String body;
    @Column(nullable = false)
    private Instant createdAt;
}
