package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.config.HelpProperties;
import adliya.uz.functioncatalogservice.dto.HelpConversationSummary;
import adliya.uz.functioncatalogservice.dto.HelpConversationView;
import adliya.uz.functioncatalogservice.dto.StaffMember;
import adliya.uz.functioncatalogservice.dto.StartHelpConversationRequest;
import adliya.uz.functioncatalogservice.entity.AuditAction;
import adliya.uz.functioncatalogservice.entity.FunctionStatus;
import adliya.uz.functioncatalogservice.entity.HelpConversation;
import adliya.uz.functioncatalogservice.entity.HelpConversationStatus;
import adliya.uz.functioncatalogservice.entity.HelpMessage;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.exception.InvalidFieldException;
import adliya.uz.functioncatalogservice.exception.WorkflowConflictException;
import adliya.uz.functioncatalogservice.repository.HelpConversationRepository;
import adliya.uz.functioncatalogservice.repository.HelpMessageRepository;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import adliya.uz.functioncatalogservice.security.CatalogAccess;
import adliya.uz.functioncatalogservice.security.JwtPrincipal;
import adliya.uz.functioncatalogservice.security.OrganizationScope;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

/**
 * Anonymous visitor questions and the staff inbox that answers them.
 *
 * <p>Visitors never sign in. Creating a question returns a random access token once; every later visitor request
 * carries that token and is looked up by its hash, so conversations cannot be reached through ids. A service-specific
 * question belongs to the service's organization; a general question (no service) has no organization and is visible
 * only to global staff. Staff access is checked here on every call, never only in the UI.</p>
 */
@Service
@RequiredArgsConstructor
public class HelpConversationService {

    public static final int LIST_LIMIT = 500;
    private static final int MIN_MESSAGE_LENGTH = 10;
    private static final int MAX_LINKS = 3;
    private static final int LABEL_MAX_LENGTH = 150;
    private static final String NOT_FOUND = "Conversation not found";

    private final HelpConversationRepository conversations;
    private final HelpMessageRepository messages;
    private final OrgFunctionRepository functions;
    private final HelpRateLimiter rateLimiter;
    private final HelpProperties properties;
    private final HelpNotificationMailer mailer;
    private final IdentityOrganizationClient organizations;
    private final CatalogAccess access;
    private final AuditWriter audit;
    private final TransactionTemplate transaction;

    public boolean notificationsAvailable() {
        return mailer.available();
    }

    // ---------------------------------------------------------------- visitor side

    public HelpConversationView.Started start(StartHelpConversationRequest request, String clientAddress) {
        rateLimiter.acquire(clientAddress);
        String token = HelpAccessTokens.generate();
        boolean notifications = mailer.available();
        if (request.website() != null && !request.website().isBlank()) {
            // Honeypot filled in: answer like a success so that bots learn nothing, but store nothing.
            Instant now = Instant.now();
            return new HelpConversationView.Started(token, notifications, new HelpConversationView(HelpConversationStatus.NEW,
                    null, null, null, true, now, now, false, true, List.of(new HelpConversationView.Message(
                    HelpMessage.Author.VISITOR, VisitorText.normalize(request.message()), now))));
        }
        String body = message(request.message());
        OrgFunction service = request.serviceId() == null ? null
                : functions.findByIdAndStatus(request.serviceId(), FunctionStatus.PUBLISHED)
                .orElseThrow(() -> new NoSuchElementException("Service not found: " + request.serviceId()));
        String email = notifications ? blankToNull(request.email()) : null;
        HelpConversation saved = transaction.execute(status -> {
            Instant now = Instant.now();
            HelpConversation conversation = conversations.save(HelpConversation.builder()
                    .accessTokenHash(HelpAccessTokens.hash(token))
                    .functionId(service == null ? null : service.getId())
                    .organizationId(service == null ? null : service.getOrganizationId())
                    .subjectLabel(service == null ? null : truncate(service.getName()))
                    .language(language(request.language()))
                    .status(HelpConversationStatus.NEW)
                    .notifyEmail(email)
                    .createdAt(now).updatedAt(now).lastVisitorMessageAt(now)
                    .build());
            messages.save(HelpMessage.builder().conversationId(conversation.getId()).author(HelpMessage.Author.VISITOR)
                    .body(body).createdAt(now).build());
            return conversation;
        });
        if (email != null) {
            mailer.sendConfirmation(email, token);
        }
        return new HelpConversationView.Started(token, notifications, visitorView(saved));
    }

    public HelpConversationView visitorConversation(String token) {
        return visitorView(byToken(token));
    }

    public HelpConversationView visitorFollowUp(String token, String text, String website, String clientAddress) {
        rateLimiter.acquire(clientAddress);
        HelpConversation conversation = byToken(token);
        if (website != null && !website.isBlank()) {
            return visitorView(conversation);
        }
        String body = message(text);
        HelpConversation updated = transaction.execute(status -> {
            HelpConversation current = conversations.findById(conversation.getId()).orElseThrow(() -> new NoSuchElementException(NOT_FOUND));
            List<HelpMessage> thread = messages.findAllByConversationIdOrderByCreatedAtAscIdAsc(current.getId());
            if (current.getStatus() == HelpConversationStatus.CLOSED) {
                throw new WorkflowConflictException("This conversation is closed. Ask a new question if you still need help.");
            }
            if (!canWrite(current, thread)) {
                throw new WorkflowConflictException("Please wait for a reply before writing again.");
            }
            Instant now = Instant.now();
            messages.save(HelpMessage.builder().conversationId(current.getId()).author(HelpMessage.Author.VISITOR)
                    .body(body).createdAt(now).build());
            if (current.getStatus() == HelpConversationStatus.ANSWERED) {
                current.setStatus(HelpConversationStatus.IN_PROGRESS);
            }
            current.setLastVisitorMessageAt(now);
            current.setUpdatedAt(now);
            return conversations.saveAndFlush(current);
        });
        return visitorView(updated);
    }

    // ---------------------------------------------------------------- staff side

    public record InboxQuery(Set<HelpConversationStatus> statuses, Long organizationId, Long serviceId, boolean generalOnly,
                             boolean assignedToMe) {}

    public List<HelpConversationSummary> inbox(InboxQuery query) {
        OrganizationScope scope = access.scope(query.organizationId());
        if (query.generalOnly() && !scope.allOrganizations()) {
            throw new AccessDeniedException("Only global staff can view general questions");
        }
        if (scope.empty()) {
            return List.of();
        }
        Specification<HelpConversation> specification = inScope(scope)
                .and((root, criteria, builder) -> root.get("status").in(query.statuses()));
        if (query.generalOnly()) {
            specification = specification.and((root, criteria, builder) -> builder.isNull(root.get("organizationId")));
        }
        if (query.serviceId() != null) {
            specification = specification.and((root, criteria, builder) -> builder.equal(root.get("functionId"), query.serviceId()));
        }
        if (query.assignedToMe()) {
            Long me = access.principal().userId();
            specification = specification.and((root, criteria, builder) -> builder.equal(root.get("assignedUserId"), me == null ? -1L : me));
        }
        List<HelpConversation> found = conversations.findAll(specification,
                PageRequest.of(0, LIST_LIMIT, Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id")))).getContent();
        Map<Long, Long> counts = counts(found.stream().map(HelpConversation::getId).toList());
        return found.stream().map(item -> HelpConversationSummary.of(item, counts.getOrDefault(item.getId(), 0L))).toList();
    }

    public HelpConversationSummary.Detail detail(Long id) {
        HelpConversation conversation = visibleToStaff(id);
        List<HelpMessage> thread = messages.findAllByConversationIdOrderByCreatedAtAscIdAsc(id);
        return new HelpConversationSummary.Detail(HelpConversationSummary.of(conversation, thread.size()),
                thread.stream().map(HelpConversationSummary.Message::of).toList());
    }

    public HelpConversationSummary.Detail reply(Long id, String text) {
        String body = staffMessage(text);
        String[] notify = new String[1];
        transaction.executeWithoutResult(status -> {
            HelpConversation conversation = visibleToStaff(id);
            if (conversation.getStatus() == HelpConversationStatus.CLOSED) {
                throw new WorkflowConflictException("Reopen the conversation (set it to In progress) before replying");
            }
            if (messages.countByConversationId(id) >= properties.getMaxMessages()) {
                throw new WorkflowConflictException("This conversation reached its message limit; close it and ask the visitor to start a new one");
            }
            AuditWriter.Actor actor = audit.actor();
            Instant now = Instant.now();
            messages.save(HelpMessage.builder().conversationId(id).author(HelpMessage.Author.STAFF).staffUserId(actor.id())
                    .staffLabel(actor.email()).body(body).createdAt(now).build());
            HelpConversationStatus previous = conversation.getStatus();
            conversation.setStatus(HelpConversationStatus.ANSWERED);
            conversation.setLastStaffReplyAt(now);
            conversation.setUpdatedAt(now);
            if (conversation.getAssignedUserId() == null) {
                conversation.setAssignedUserId(actor.id());
                conversation.setAssignedUserName(actor.email());
            }
            conversations.saveAndFlush(conversation);
            audit.helpConversation(conversation, AuditAction.HELP_REPLY,
                    "Question #" + id + ": reply sent; " + previous + " -> " + HelpConversationStatus.ANSWERED);
            notify[0] = conversation.getNotifyEmail();
        });
        if (notify[0] != null) {
            mailer.sendReplyNotice(notify[0]);
        }
        return detail(id);
    }

    public HelpConversationSummary.Detail changeStatus(Long id, HelpConversationStatus target) {
        transaction.executeWithoutResult(status -> {
            HelpConversation conversation = visibleToStaff(id);
            HelpConversationStatus previous = conversation.getStatus();
            if (!previous.canMoveTo(target)) {
                throw new WorkflowConflictException("A conversation cannot move from " + previous + " to " + target
                        + (target == HelpConversationStatus.ANSWERED ? "; send a reply instead" : ""));
            }
            Instant now = Instant.now();
            conversation.setStatus(target);
            conversation.setUpdatedAt(now);
            if (target == HelpConversationStatus.CLOSED) {
                conversation.setClosedAt(now);
                conversation.setNotifyEmail(null);
            } else {
                conversation.setClosedAt(null);
            }
            conversations.saveAndFlush(conversation);
            audit.helpConversation(conversation, AuditAction.HELP_STATUS_CHANGE, "Question #" + id + ": " + previous + " -> " + target);
        });
        return detail(id);
    }

    /** Staff who may be assigned: active members of the conversation's organization; for general questions the caller only. */
    public List<StaffMember> candidates(Long id) {
        HelpConversation conversation = visibleToStaff(id);
        if (conversation.getOrganizationId() == null) {
            JwtPrincipal me = access.principal();
            return me.userId() == null ? List.of() : List.of(new StaffMember(me.userId(), null, null, me.email(), me.role()));
        }
        return organizations.activeMembers(conversation.getOrganizationId());
    }

    public HelpConversationSummary.Detail assign(Long id, Long userId) {
        HelpConversation current = visibleToStaff(id);
        StaffMember member = userId == null ? null : candidates(id).stream()
                .filter(candidate -> userId.equals(candidate.id())).findFirst()
                .orElseThrow(() -> new InvalidFieldException("userId", "Choose an active staff member of the responsible organization"));
        transaction.executeWithoutResult(status -> {
            HelpConversation conversation = conversations.findById(current.getId()).orElseThrow(() -> new NoSuchElementException(NOT_FOUND));
            Long previous = conversation.getAssignedUserId();
            conversation.setAssignedUserId(member == null ? null : member.id());
            conversation.setAssignedUserName(member == null ? null : member.displayName());
            conversation.setUpdatedAt(Instant.now());
            conversations.saveAndFlush(conversation);
            audit.helpConversation(conversation, AuditAction.HELP_ASSIGNEE_CHANGE, "Question #" + id + ": assignee "
                    + (previous == null ? "nobody" : "#" + previous) + " -> " + (member == null ? "nobody" : "#" + member.id()));
        });
        return detail(id);
    }

    // ---------------------------------------------------------------- helpers

    private HelpConversation byToken(String token) {
        if (!HelpAccessTokens.wellFormed(token)) {
            throw new NoSuchElementException(NOT_FOUND);
        }
        return conversations.findByAccessTokenHash(HelpAccessTokens.hash(token)).orElseThrow(() -> new NoSuchElementException(NOT_FOUND));
    }

    /** Organization staff see their organizations' conversations; general questions only global staff. */
    private HelpConversation visibleToStaff(Long id) {
        HelpConversation conversation = conversations.findById(id).orElseThrow(() -> new NoSuchElementException(NOT_FOUND));
        if (conversation.getOrganizationId() == null) {
            if (!access.global()) {
                throw new AccessDeniedException("Only global staff can handle general questions");
            }
        } else {
            access.requireOrganization(conversation.getOrganizationId());
        }
        return conversation;
    }

    private HelpConversationView visitorView(HelpConversation conversation) {
        List<HelpMessage> thread = messages.findAllByConversationIdOrderByCreatedAtAscIdAsc(conversation.getId());
        return HelpConversationView.of(conversation, thread, canWrite(conversation, thread));
    }

    private boolean canWrite(HelpConversation conversation, List<HelpMessage> thread) {
        if (conversation.getStatus() == HelpConversationStatus.CLOSED || thread.size() >= properties.getMaxMessages()) {
            return false;
        }
        int unanswered = 0;
        for (int index = thread.size() - 1; index >= 0 && thread.get(index).getAuthor() == HelpMessage.Author.VISITOR; index--) {
            unanswered++;
        }
        return unanswered < properties.getMaxUnansweredVisitorMessages();
    }

    private Map<Long, Long> counts(Collection<Long> ids) {
        Map<Long, Long> counts = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : messages.countByConversationIds(ids)) {
                counts.put((Long) row[0], ((Number) row[1]).longValue());
            }
        }
        return counts;
    }

    private static Specification<HelpConversation> inScope(OrganizationScope scope) {
        return scope.allOrganizations()
                ? (root, criteria, builder) -> builder.conjunction()
                : (root, criteria, builder) -> root.get("organizationId").in(scope.organizationIds());
    }

    private static String message(String raw) {
        String value = VisitorText.normalize(raw);
        if (!VisitorText.meaningful(value, MIN_MESSAGE_LENGTH)) {
            throw new InvalidFieldException("message", "Write your question in at least " + MIN_MESSAGE_LENGTH + " characters");
        }
        if (value.length() > 2000) {
            throw new InvalidFieldException("message", "A message may contain at most 2000 characters");
        }
        if (VisitorText.links(value) > MAX_LINKS) {
            throw new InvalidFieldException("message", "A message may contain at most " + MAX_LINKS + " links");
        }
        if (VisitorText.containsLongNumber(value)) {
            throw new InvalidFieldException("message",
                    "Remove identification, card or document numbers: they are not needed to answer a question");
        }
        return value;
    }

    private static String staffMessage(String raw) {
        String value = VisitorText.normalize(raw);
        if (!VisitorText.meaningful(value, 2)) {
            throw new InvalidFieldException("message", "Write a reply");
        }
        if (value.length() > 2000) {
            throw new InvalidFieldException("message", "A reply may contain at most 2000 characters");
        }
        return value;
    }

    private static String language(String value) {
        String language = blankToNull(value);
        return language == null ? null : language.toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String truncate(String value) {
        return value == null || value.length() <= LABEL_MAX_LENGTH ? value : value.substring(0, LABEL_MAX_LENGTH);
    }

    public static Set<HelpConversationStatus> statuses(String value) {
        String normalized = value == null || value.isBlank() ? "OPEN" : value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "OPEN" -> HelpConversationStatus.AWAITING_STAFF;
            case "ALL" -> EnumSet.allOf(HelpConversationStatus.class);
            default -> {
                try {
                    yield EnumSet.of(HelpConversationStatus.valueOf(normalized));
                } catch (IllegalArgumentException exception) {
                    throw new IllegalArgumentException("Unknown conversation status: " + value);
                }
            }
        };
    }
}
