package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.entity.AuditAction;
import adliya.uz.functioncatalogservice.entity.AuditLog;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("select a from AuditLog a join a.affectedFunctionIds f where f = :id order by a.performedAt, a.id")
    List<AuditLog> findFunctionHistory(@Param("id") Long id);

    List<AuditLog> findAllByEntityTypeAndEntityIdOrderByPerformedAtAscIdAsc(String entityType, Long entityId);

    @Query("""
            select count(a) > 0 from AuditLog a join a.affectedFunctionIds f
            where f = :functionId and a.action in :actions and a.performedAt > :since
            """)
    boolean existsFunctionChange(@Param("functionId") Long functionId, @Param("actions") Collection<AuditAction> actions,
                                 @Param("since") Instant since);
}
