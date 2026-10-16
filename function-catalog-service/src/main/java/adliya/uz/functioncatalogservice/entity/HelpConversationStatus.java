package adliya.uz.functioncatalogservice.entity;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/** NEW: nobody has handled it yet. IN_PROGRESS: staff is on it or the visitor wrote again. ANSWERED: waiting for the visitor. */
public enum HelpConversationStatus {
    NEW, IN_PROGRESS, ANSWERED, CLOSED;

    /** Conversations that still need a reply from staff. */
    public static final Set<HelpConversationStatus> AWAITING_STAFF = Collections.unmodifiableSet(EnumSet.of(NEW, IN_PROGRESS));

    /** Status changes staff may make by hand; ANSWERED is set by replying and NEW only by the visitor. */
    public boolean canMoveTo(HelpConversationStatus target) {
        if (target == this) {
            return false;
        }
        return switch (target) {
            case IN_PROGRESS, CLOSED -> true;
            case NEW, ANSWERED -> false;
        };
    }
}
