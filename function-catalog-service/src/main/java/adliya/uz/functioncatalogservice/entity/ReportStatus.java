package adliya.uz.functioncatalogservice.entity;

import java.util.EnumSet;
import java.util.Set;

public enum ReportStatus {
    NEW, IN_REVIEW, RESOLVED, DISMISSED;

    public static final Set<ReportStatus> OPEN = EnumSet.of(NEW, IN_REVIEW);

    public boolean closed() {
        return this == RESOLVED || this == DISMISSED;
    }

    public boolean canMoveTo(ReportStatus target) {
        if (target == this) {
            return false;
        }
        return closed() ? target == IN_REVIEW : target != NEW;
    }
}
