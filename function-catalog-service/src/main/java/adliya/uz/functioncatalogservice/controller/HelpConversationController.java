package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.dto.HelpAssigneeRequest;
import adliya.uz.functioncatalogservice.dto.HelpConversationSummary;
import adliya.uz.functioncatalogservice.dto.HelpConversationView;
import adliya.uz.functioncatalogservice.dto.HelpMessageRequest;
import adliya.uz.functioncatalogservice.dto.HelpStatusRequest;
import adliya.uz.functioncatalogservice.dto.StaffMember;
import adliya.uz.functioncatalogservice.dto.StartHelpConversationRequest;
import adliya.uz.functioncatalogservice.service.ClientAddressResolver;
import adliya.uz.functioncatalogservice.service.HelpConversationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/help")
@RequiredArgsConstructor
@Tag(name = "Visitor questions", description = "Questions from visitors without accounts about published services, answered by "
        + "the responsible organization (general questions by global support). Not a live chat: replies arrive when staff "
        + "answer. Visitors follow a conversation only with the private access token returned once on creation.")
public class HelpConversationController {

    /** The visitor's private access token travels in this header, never in a URL that could end up in logs. */
    public static final String TOKEN_HEADER = "X-Conversation-Token";
    static final String VIEW = "hasAuthority('VISITOR_QUESTIONS_VIEW')";
    static final String REPLY = "hasAuthority('VISITOR_QUESTIONS_VIEW') and hasAuthority('VISITOR_QUESTIONS_REPLY')";

    private final HelpConversationService help;
    private final ClientAddressResolver clientAddresses;

    @GetMapping("/options")
    @Operation(summary = "What the visitor form can offer", description = "Whether e-mail reply notifications are configured, and length limits.")
    public Map<String, Object> options() {
        return Map.of("notificationsAvailable", help.notificationsAvailable(), "minLength", 10, "maxLength", 2000);
    }

    @PostMapping("/conversations")
    @Operation(summary = "Ask a question (anonymous)",
            description = "Returns the private access token once. serviceId routes the question to that service's organization; "
                    + "without it the question goes to global support. The e-mail address is optional and kept only when "
                    + "notifications are configured. Rate limited per visitor address.")
    public ResponseEntity<HelpConversationView.Started> start(@Valid @RequestBody StartHelpConversationRequest request,
                                                              HttpServletRequest http) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(help.start(request, clientAddresses.resolve(http)));
    }

    @GetMapping("/conversation")
    @Operation(summary = "Read my conversation (anonymous, with the access token header)")
    public ResponseEntity<HelpConversationView> conversation(@RequestHeader(name = TOKEN_HEADER, required = false) String token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(help.visitorConversation(token));
    }

    @PostMapping("/conversation/messages")
    @Operation(summary = "Write again in my conversation (anonymous, with the access token header)")
    public ResponseEntity<HelpConversationView> followUp(@RequestHeader(name = TOKEN_HEADER, required = false) String token,
                                                         @Valid @RequestBody HelpMessageRequest request, HttpServletRequest http) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(help.visitorFollowUp(token, request.message(), request.website(), clientAddresses.resolve(http)));
    }

    @GetMapping("/inbox")
    @PreAuthorize(VIEW)
    @Operation(summary = "Staff inbox", description = "status: OPEN (new and in progress, default), NEW, IN_PROGRESS, ANSWERED, "
            + "CLOSED or ALL. Organization staff see their organizations only; general questions (general=true) are global-only.")
    public List<HelpConversationSummary> inbox(@RequestParam(required = false) String status,
                                               @RequestParam(required = false) Long organizationId,
                                               @RequestParam(required = false) Long serviceId,
                                               @RequestParam(defaultValue = "false") boolean general,
                                               @RequestParam(required = false) String assignee) {
        if (assignee != null && !assignee.isBlank() && !"me".equalsIgnoreCase(assignee.trim())) {
            throw new IllegalArgumentException("assignee accepts only \"me\"");
        }
        return help.inbox(new HelpConversationService.InboxQuery(HelpConversationService.statuses(status), organizationId, serviceId,
                general, assignee != null && !assignee.isBlank()));
    }

    @GetMapping("/inbox/{id}")
    @PreAuthorize(VIEW)
    public HelpConversationSummary.Detail detail(@PathVariable Long id) {
        return help.detail(id);
    }

    @PostMapping("/inbox/{id}/replies")
    @PreAuthorize(REPLY)
    @Operation(summary = "Reply to the visitor", description = "Sets the status to ANSWERED and, if requested and configured, e-mails a notice.")
    public HelpConversationSummary.Detail reply(@PathVariable Long id, @Valid @RequestBody HelpMessageRequest request) {
        return help.reply(id, request.message());
    }

    @PutMapping("/inbox/{id}/status")
    @PreAuthorize(REPLY)
    @Operation(summary = "Mark in progress or close", description = "Closing removes the visitor's e-mail address.")
    public HelpConversationSummary.Detail status(@PathVariable Long id, @Valid @RequestBody HelpStatusRequest request) {
        return help.changeStatus(id, request.status());
    }

    @GetMapping("/inbox/{id}/candidates")
    @PreAuthorize(REPLY)
    public List<StaffMember> candidates(@PathVariable Long id) {
        return help.candidates(id);
    }

    @PutMapping("/inbox/{id}/assignee")
    @PreAuthorize(REPLY)
    public HelpConversationSummary.Detail assign(@PathVariable Long id, @Valid @RequestBody HelpAssigneeRequest request) {
        return help.assign(id, request.userId());
    }
}
