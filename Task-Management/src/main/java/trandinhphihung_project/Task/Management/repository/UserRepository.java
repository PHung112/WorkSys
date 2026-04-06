package trandinhphihung_project.Task.Management.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import trandinhphihung_project.Task.Management.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    List<User> findByUsernameContainingIgnoreCase(String keyword);
}
