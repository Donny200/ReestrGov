package adliya.uz.functioncatalogservice.repository;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrgFunctionRepository extends JpaRepository<OrgFunction, Long> {
    List<OrgFunction> findAllByOrganizationId(Long organizationId);
    List<OrgFunction> findAllByCategory(String category);
}

