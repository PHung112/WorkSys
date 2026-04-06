package trandinhphihung_project.Task.Management.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import trandinhphihung_project.Task.Management.service.NotificationService;

@Component
public class DeadlineScheduler {

    private final NotificationService notificationService;

    public DeadlineScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // Chạy lúc 8:00 sáng mỗi ngày (UTC+7 → set zone nếu cần)
    @Scheduled(cron = "0 0 1 * * *") // 8:00 ICT = 1:00 UTC
    public void checkDeadlines() {
        notificationService.sendDeadlineReminders();
    }
}
