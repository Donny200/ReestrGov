package adliya.uz.functioncatalogservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** Visitor questions ("Ask a question"): abuse limits and the optional e-mail notification. */
@Component
@ConfigurationProperties(prefix = "catalog.help")
@Getter
@Setter
public class HelpProperties {
    /** New questions and follow-ups per visitor address and window. */
    private int perClientLimit = 6;
    private Duration perClientWindow = Duration.ofMinutes(15);
    private int globalLimit = 300;
    private Duration globalWindow = Duration.ofHours(1);
    private int maxTrackedClients = 10_000;
    /** Messages of any author in one conversation. */
    private int maxMessages = 40;
    /** Visitor messages in a row without a staff reply in between. */
    private int maxUnansweredVisitorMessages = 4;
    /** SPA path that opens a conversation; the token is appended as the URL fragment (#token), never as a query. */
    private String conversationPath = "/help/conversation";
    /** Absolute public origin of the SPA (e.g. https://reestr.example); needed for links in e-mails. */
    private String publicBaseUrl = "";
    private Mail mail = new Mail();

    @Getter
    @Setter
    public static class Mail {
        /** Reply notifications are offered only when this is true, a sender is set and SMTP (spring.mail.host) is configured. */
        private boolean enabled = false;
        private String from = "";
    }
}
