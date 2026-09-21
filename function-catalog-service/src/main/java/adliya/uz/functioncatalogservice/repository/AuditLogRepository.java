package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.entity.AuditLog;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("select a from AuditLog a join a.affectedFunctionIds f where f = :id order by a.performedAt, a.id")
    List<AuditLog> findFunctionHistory(@Param("id") Long id);
}
