package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.config.HelpProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Optional e-mail for visitor questions. Delivery counts as available only when the operator enabled it and configured
 * SMTP (spring.mail.host), a sender and the public SPA origin; otherwise visitors are told to keep their private link.
 * The confirmation e-mail carries the private link once (the server cannot rebuild it later because only the token's
 * hash is stored); reply notifications only say that a reply is waiting. Addresses, tokens and message texts are
 * never logged, and a delivery failure never fails the visitor's or the staff member's request.
 */
@Component
@Slf4j
public class HelpNotificationMailer {

    private final HelpProperties properties;
    private final ObjectProvider<JavaMailSender> senders;

    public HelpNotificationMailer(HelpProperties properties, ObjectProvider<JavaMailSender> senders) {
        this.properties = properties;
        this.senders = senders;
    }

    public boolean available() {
        return properties.getMail().isEnabled()
                && StringUtils.hasText(properties.getMail().getFrom())
                && StringUtils.hasText(properties.getPublicBaseUrl())
                && configured(senders.getIfAvailable());
    }

    /** An empty SPRING_MAIL_HOST still creates a sender bean; it only counts when it has a host. */
    private static boolean configured(JavaMailSender sender) {
        return sender instanceof JavaMailSenderImpl impl ? StringUtils.hasText(impl.getHost()) : sender != null;
    }

    public void sendConfirmation(String email, String token) {
        String link = properties.getPublicBaseUrl().replaceAll("/+$", "") + properties.getConversationPath() + "#" + token;
        send(email, "ReestrGov: your question / ваш вопрос / savolingiz", """
                Your question was received. Keep this private link: it is the only way to read the answer and to write again.
                Anyone who has the link can read the conversation, so do not forward it.

                Ваш вопрос получен. Сохраните эту личную ссылку: только по ней можно прочитать ответ и написать снова.
                Любой, у кого есть ссылка, может прочитать переписку, поэтому не пересылайте её.

                Savolingiz qabul qilindi. Ushbu shaxsiy havolani saqlang: javobni o‘qish va yana yozish faqat u orqali mumkin.
                Havolaga ega har kim yozishmani o‘qiy oladi, shuning uchun uni hech kimga yubormang.

                %s
                """.formatted(link));
    }

    public void sendReplyNotice(String email) {
        send(email, "ReestrGov: a reply to your question / ответ на ваш вопрос / savolingizga javob", """
                The organization replied to your question. Open the private link from the confirmation e-mail (or the link you saved) to read it.

                Организация ответила на ваш вопрос. Откройте личную ссылку из письма-подтверждения (или сохранённую ссылку), чтобы прочитать ответ.

                Tashkilot savolingizga javob berdi. Javobni o‘qish uchun tasdiqlash xatidagi (yoki saqlab qo‘ygan) shaxsiy havolani oching.
                """);
    }

    private void send(String email, String subject, String text) {
        JavaMailSender sender = senders.getIfAvailable();
        if (sender == null || !available()) {
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.getMail().getFrom());
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text);
        try {
            sender.send(message);
        } catch (MailException exception) {
            log.warn("Visitor question notification could not be delivered: {}", exception.getClass().getSimpleName());
        }
    }
}
