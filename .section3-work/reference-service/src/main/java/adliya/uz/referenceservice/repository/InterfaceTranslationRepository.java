package adliya.uz.referenceservice.repository;

import adliya.uz.referenceservice.entity.InterfaceTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterfaceTranslationRepository extends JpaRepository<InterfaceTranslation, Long> {
    List<InterfaceTranslation> findAllByLanguageCodeOrderByTranslationKeyAsc(String languageCode);

    void deleteByLanguageCode(String languageCode);
}
