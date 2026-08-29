package worksys.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import worksys.service.NotificationService;

@Component
public class DeadlineScheduler {

    private final NotificationService notificationService;
    private final worksys.service.TaskService taskService;

    public DeadlineScheduler(NotificationService notificationService, worksys.service.TaskService taskService) {
        this.notificationService = notificationService;
        this.taskService = taskService;
    }

    // Chạy lúc 8:00 sáng mỗi ngày (UTC+7 → set zone nếu cần)
    @Scheduled(cron = "0 0 1 * * *") // 8:00 ICT = 1:00 UTC
    public void checkDeadlines() {
        notificationService.sendDeadlineReminders();
        taskService.autoArchiveTasks();
    }
}
