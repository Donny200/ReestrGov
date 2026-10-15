package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.entity.TranslationJob;
import adliya.uz.functioncatalogservice.entity.TranslationJobStatus;
import adliya.uz.functioncatalogservice.entity.TranslationTarget;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TranslationJobRepository extends JpaRepository<TranslationJob, Long> {
    Optional<TranslationJob> findByTargetTypeAndTargetId(TranslationTarget targetType, Long targetId);
    List<TranslationJob> findAllByTargetTypeAndTargetIdIn(TranslationTarget targetType, Collection<Long> targetIds);
    long countByStatus(TranslationJobStatus status);
    void deleteByTargetTypeAndTargetId(TranslationTarget targetType, Long targetId);

    /** Pending jobs whose time has come, plus running jobs whose lease expired (worker died mid-run). */
    @Query("select j from TranslationJob j where j.nextAttemptAt <= :now and j.status in ('PENDING', 'RUNNING') order by j.nextAttemptAt, j.id")
    List<TranslationJob> findDue(Instant now, Pageable pageable);
}
