package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrgFunctionRepository extends JpaRepository<OrgFunction, Long> {
    List<OrgFunction> findAllByActiveTrue();
    Optional<OrgFunction> findByIdAndActiveTrue(Long id);
    List<OrgFunction> findAllByOrganizationIdAndActiveTrue(Long organizationId);
    List<OrgFunction> findAllByCategoryAndActiveTrue(String category);
}

