package worksys.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import worksys.repository.TaskRepository;
import worksys.service.NotificationService;
import worksys.service.TaskService;

@Component
public class DeadlineScheduler {

    private static final Logger log = LoggerFactory.getLogger(DeadlineScheduler.class);

    private final NotificationService notificationService;
    private final TaskService taskService;
    private final TaskRepository taskRepository;

    public DeadlineScheduler(NotificationService notificationService, TaskService taskService, TaskRepository taskRepository) {
        this.notificationService = notificationService;
        this.taskService = taskService;
        this.taskRepository = taskRepository;
    }

    // Tự động quét và lưu trữ các task DONE ngay khi hệ thống khởi động
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("[Startup] Kiem tra va khoi tao gia tri version cho cac task cu...");
        try {
            int updatedVersions = taskRepository.initializeNullVersions();
            int updatedCompleted = taskRepository.initializeNullCompletedAt();
            if (updatedVersions > 0 || updatedCompleted > 0) {
                log.info("[Startup] Da khoi tao version cho {} task va completedAt cho {} task.", updatedVersions, updatedCompleted);
            }
        } catch (Exception e) {
            log.warn("[Startup] Khong the khoi tao version/completedAt cu: {}", e.getMessage());
        }

        log.info("[Startup] Dang quet tu dong luu tru cac task DONE qua han...");
        try {
            taskService.autoArchiveTasks();
            log.info("[Startup] Quet tu dong luu tru task hoan tat.");
        } catch (Exception e) {
            log.error("[Startup] Loi khi quet tu dong luu tru task: {}", e.getMessage());
        }
    }

    // Chạy định kỳ mỗi giờ để tự động lưu trữ các task DONE đủ ngày
    @Scheduled(cron = "0 0 * * * *")
    public void hourlyArchiveCheck() {
        taskService.autoArchiveTasks();
    }

    // Chạy lúc 8:00 sáng mỗi ngày (giờ Việt Nam ICT / Asia/Ho_Chi_Minh)
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void checkDeadlines() {
        notificationService.sendDeadlineReminders();
        taskService.autoArchiveTasks();
    }
}
