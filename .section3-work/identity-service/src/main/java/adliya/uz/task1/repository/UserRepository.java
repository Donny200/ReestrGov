package adliya.uz.task1.repository;

import adliya.uz.task1.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRole_Name(String roleName);
    boolean existsByRole_Id(Long roleId);
    long countByRole_NameAndEnabledTrue(String roleName);
    List<User> findAllByRole_Name(String roleName);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update User u set u.tokenVersion = u.tokenVersion + 1 where u.id = :userId")
    int incrementTokenVersion(@Param("userId") Long userId);

}
