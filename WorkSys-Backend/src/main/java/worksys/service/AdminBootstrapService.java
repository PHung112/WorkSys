package worksys.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import worksys.entity.SystemRole;
import worksys.entity.User;
import worksys.entity.UserStatus;
import worksys.repository.UserRepository;

@Service
public class AdminBootstrapService {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapService.class);

    @Value("${admin.bootstrap.email:}")
    private String adminEmail;

    @Value("${admin.bootstrap.password:}")
    private String adminPassword;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public AdminBootstrapService(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void bootstrap() {
        // Fix database schema issues for existing users if any
        try {
            // Only reset non-bootstrap admins if adminEmail is actually configured
            if (adminEmail != null && !adminEmail.trim().isEmpty()) {
                jdbcTemplate.execute("UPDATE users SET system_role = 'USER' WHERE system_role = 'SYSTEM_ADMIN' AND email != '" + adminEmail + "'");
            }
            jdbcTemplate.execute("UPDATE users SET status = 'ACTIVE' WHERE status IS NULL");
            jdbcTemplate.execute("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
        } catch (Exception e) {
            logger.warn("Could not execute schema fix queries: {}", e.getMessage());
        }

        if (adminEmail == null || adminEmail.trim().isEmpty() || adminPassword == null || adminPassword.trim().isEmpty()) {
            logger.info("Admin bootstrap skipped: Email or password not provided in environment.");
            return;
        }



        if (userRepository.findByEmail(adminEmail).isPresent()) {
            logger.info("Admin bootstrap skipped: User with email {} already exists.", adminEmail);
            return;
        }

        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setUsername(adminEmail.split("@")[0]);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setSystemRole(SystemRole.SYSTEM_ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setCreatedAt(java.time.LocalDateTime.now());

        userRepository.save(admin);
        logger.info("System Admin bootstrapped successfully: {}", adminEmail);
    }
}
