package adliya.uz.functioncatalogservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "help_conversations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HelpConversation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /** SHA-256 (hex) of the visitor's access token; the token itself is never stored. */
    @Column(nullable = false, unique = true, length = 64)
    private String accessTokenHash;
    /** Published service the question is about; null for a general question. */
    private Long functionId;
    /** Responsible organization (from the service); null routes the question to global staff. */
    private Long organizationId;
    @Column(length = 150)
    private String subjectLabel;
    @Column(length = 35)
    private String language;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    @Builder.Default
    private HelpConversationStatus status = HelpConversationStatus.NEW;
    private Long assignedUserId;
    @Column(length = 320)
    private String assignedUserName;
    /** Optional, only for reply notifications; never shown to staff and cleared on close. */
    @Column(length = 254)
    private String notifyEmail;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Column(nullable = false)
    private Instant lastVisitorMessageAt;
    private Instant lastStaffReplyAt;
    private Instant closedAt;
    @Version
    private Long version;
}
