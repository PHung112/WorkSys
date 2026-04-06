package trandinhphihung_project.Task.Management.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import trandinhphihung_project.Task.Management.entity.Notification;
import trandinhphihung_project.Task.Management.entity.NotificationStatus;
import trandinhphihung_project.Task.Management.entity.NotificationType;
import trandinhphihung_project.Task.Management.entity.User;

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
