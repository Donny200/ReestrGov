package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface OrgFunctionRepository extends JpaRepository<OrgFunction, Long> {
    List<OrgFunction> findAllByStatus(FunctionStatus status);
    Optional<OrgFunction> findByIdAndStatus(Long id, FunctionStatus status);
    List<OrgFunction> findAllByOrganizationIdAndStatus(Long organizationId, FunctionStatus status);
    List<OrgFunction> findAllByFunctionCategory_NameAndStatus(String category, FunctionStatus status);
    List<OrgFunction> findAllByOrganizationIdIn(Collection<Long> organizationIds);
    List<OrgFunction> findAllByStatusAndOrganizationIdIn(FunctionStatus status, Collection<Long> organizationIds);
    boolean existsByFunctionCategory_Id(Long categoryId);
    Optional<OrgFunction> findBySeedKey(String seedKey);
}
