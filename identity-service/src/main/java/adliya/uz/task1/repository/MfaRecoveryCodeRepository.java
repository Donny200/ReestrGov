package adliya.uz.task1.repository;

import adliya.uz.task1.entity.MfaRecoveryCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MfaRecoveryCodeRepository extends JpaRepository<MfaRecoveryCode, Long> {
    Optional<MfaRecoveryCode> findByUserIdAndCodeHashAndUsedAtIsNull(Long userId, String codeHash);
    long countByUserIdAndUsedAtIsNull(Long userId);
    List<MfaRecoveryCode> findAllByUserId(Long userId);
    void deleteAllByUserId(Long userId);
}
