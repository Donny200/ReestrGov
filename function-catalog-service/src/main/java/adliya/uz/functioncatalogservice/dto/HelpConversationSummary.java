package adliya.uz.functioncatalogservice.dto;

import adliya.uz.functioncatalogservice.entity.HelpConversation;
import adliya.uz.functioncatalogservice.entity.HelpConversationStatus;
import adliya.uz.functioncatalogservice.entity.HelpMessage;

import java.time.Instant;
import java.util.List;

/** Staff inbox row. The visitor's e-mail is never included; only whether a notification was requested. */
public record HelpConversationSummary(Long id, HelpConversationStatus status, Long serviceId, String serviceName,
                                      Long organizationId, boolean general, String language, Long assignedUserId,
                                      String assignedUserName, Instant createdAt, Instant updatedAt,
                                      Instant lastVisitorMessageAt, Instant lastStaffReplyAt, long messageCount,
                                      boolean notificationRequested) {

    public static HelpConversationSummary of(HelpConversation conversation, long messageCount) {
        return new HelpConversationSummary(conversation.getId(), conversation.getStatus(), conversation.getFunctionId(),
                conversation.getSubjectLabel(), conversation.getOrganizationId(), conversation.getOrganizationId() == null,
                conversation.getLanguage(), conversation.getAssignedUserId(), conversation.getAssignedUserName(),
                conversation.getCreatedAt(), conversation.getUpdatedAt(), conversation.getLastVisitorMessageAt(),
                conversation.getLastStaffReplyAt(), messageCount, conversation.getNotifyEmail() != null);
    }

    public record Detail(HelpConversationSummary conversation, List<Message> messages) {}

    public record Message(Long id, HelpMessage.Author author, String body, Instant createdAt, Long staffUserId, String staffLabel) {
        public static Message of(HelpMessage message) {
            return new Message(message.getId(), message.getAuthor(), message.getBody(), message.getCreatedAt(),
                    message.getStaffUserId(), message.getStaffLabel());
        }
    }
}
