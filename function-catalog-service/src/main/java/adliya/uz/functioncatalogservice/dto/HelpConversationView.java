package adliya.uz.functioncatalogservice.dto;

import adliya.uz.functioncatalogservice.entity.HelpConversation;
import adliya.uz.functioncatalogservice.entity.HelpConversationStatus;
import adliya.uz.functioncatalogservice.entity.HelpMessage;

import java.time.Instant;
import java.util.List;

/**
 * What the visitor sees through their private link: the messages, never staff names, e-mail addresses or ids other
 * than the public service id. {@code canWrite} is false once the conversation is closed or the follow-up limit is reached.
 */
public record HelpConversationView(HelpConversationStatus status, Long serviceId, String serviceName, Long organizationId,
                                   boolean general, Instant createdAt, Instant updatedAt, boolean notificationRequested,
                                   boolean canWrite, List<Message> messages) {

    public record Message(HelpMessage.Author author, String body, Instant createdAt) {}

    public static HelpConversationView of(HelpConversation conversation, List<HelpMessage> messages, boolean canWrite) {
        return new HelpConversationView(conversation.getStatus(), conversation.getFunctionId(), conversation.getSubjectLabel(),
                conversation.getOrganizationId(), conversation.getOrganizationId() == null, conversation.getCreatedAt(),
                conversation.getUpdatedAt(), conversation.getNotifyEmail() != null, canWrite,
                messages.stream().map(message -> new Message(message.getAuthor(), message.getBody(), message.getCreatedAt())).toList());
    }

    /** Returned once, when the question is created: the token is not stored and cannot be shown again. */
    public record Started(String accessToken, boolean notificationsAvailable, HelpConversationView conversation) {}
}
