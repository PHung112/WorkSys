package worksys.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import worksys.entity.SystemRole;
import worksys.entity.User;
import worksys.entity.UserStatus;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    List<User> findByUsernameContainingIgnoreCase(String keyword);

    List<User> findByEmailContainingIgnoreCase(String keyword);

    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(String username, String email, Pageable pageable);

    Page<User> findBySystemRole(SystemRole role, Pageable pageable);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    List<User> findBySystemRole(SystemRole role);

    long countBySystemRoleAndStatus(SystemRole role, UserStatus status);
}
