package worksys.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import worksys.entity.Notification;
import worksys.entity.NotificationStatus;
import worksys.entity.NotificationType;
import worksys.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
        List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

        long countByRecipientAndReadFalse(User recipient);

        List<Notification> findByRecipientAndReadFalse(User recipient);

        Optional<Notification> findByRecipientAndProjectIdAndTypeAndStatus(
                        User recipient, Long projectId, NotificationType type, NotificationStatus status);

        boolean existsByRecipientAndTypeAndTaskIdAndCreatedAtAfter(
                        User recipient, NotificationType type, Long taskId, LocalDateTime after);
}
