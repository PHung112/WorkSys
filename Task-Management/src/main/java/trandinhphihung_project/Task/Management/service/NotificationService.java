package trandinhphihung_project.Task.Management.service;

import org.springframework.stereotype.Service;
import trandinhphihung_project.Task.Management.dto.NotificationDTO;
import trandinhphihung_project.Task.Management.entity.*;
import trandinhphihung_project.Task.Management.repository.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final RealtimeEventService realtimeEventService;

    public NotificationService(NotificationRepository notificationRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            TaskRepository taskRepository,
            RealtimeEventService realtimeEventService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskRepository = taskRepository;
        this.realtimeEventService = realtimeEventService;
    }

    // ── Thông báo giao task ────────────────────────────────────────────
    public void createTaskAssignedNotification(Long taskId, String taskTitle,
            Long projectId, String projectName,
            Long assignerId, Long assigneeId) {
        User assigner = userRepository.findById(assignerId).orElse(null);
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new RuntimeException("Assignee not found"));

        Notification n = new Notification();
        n.setRecipient(assignee);
        n.setSender(assigner);
        n.setMessage("Bạn có 1 task mới được giao từ "
                + (assigner != null ? assigner.getUsername() : "hệ thống")
                + " ở project \"" + projectName + "\": " + taskTitle);
        n.setType(NotificationType.TASK_ASSIGNED);
        n.setProjectId(projectId);
        n.setProjectName(projectName);
        n.setTaskId(taskId);
        n.setTaskName(taskTitle);
        n.setRead(false);
        notificationRepository.save(n);
        realtimeEventService.publishNotificationChanged(assigneeId, "TASK_ASSIGNED");
    }

    // ── Thông báo nhận task ────────────────────────────────────────────
    public void createTaskAcceptedNotification(Long taskId, String taskTitle,
            Long projectId, String projectName,
            Long acceptorId, Long originalAssignerId) {
        if (originalAssignerId == null)
            return;
        User acceptor = userRepository.findById(acceptorId).orElse(null);
        User assigner = userRepository.findById(originalAssignerId)
                .orElseThrow(() -> new RuntimeException("Assigner not found"));

        Notification n = new Notification();
        n.setRecipient(assigner);
        n.setSender(acceptor);
        n.setMessage((acceptor != null ? acceptor.getUsername() : "Thành viên")
                + " đã nhận task \"" + taskTitle
                + "\" ở project \"" + projectName + "\"");
        n.setType(NotificationType.TASK_ACCEPTED);
        n.setProjectId(projectId);
        n.setProjectName(projectName);
        n.setTaskId(taskId);
        n.setTaskName(taskTitle);
        n.setRead(false);
        notificationRepository.save(n);
        realtimeEventService.publishNotificationChanged(assigner.getId(), "TASK_ACCEPTED");
    }

    // ── Gửi lời mời ──────────────────────────────────────────────────────────
    public void createInviteNotification(Long projectId, Long senderId, Long recipientId, String roleStr) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        if (projectMemberRepository.findByProjectAndUser(project, recipient).isPresent()) {
            throw new RuntimeException("Người dùng đã là thành viên của project này");
        }

        if (notificationRepository.findByRecipientAndProjectIdAndTypeAndStatus(
                recipient, projectId, NotificationType.INVITE, NotificationStatus.PENDING).isPresent()) {
            throw new RuntimeException("Đã có lời mời đang chờ xử lý cho người dùng này");
        }

        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setSender(sender);
        n.setMessage("Bạn được mời vào project \"" + project.getName() + "\" bởi " + sender.getUsername());
        n.setType(NotificationType.INVITE);
        n.setProjectId(projectId);
        n.setProjectName(project.getName());
        n.setInviteRole(roleStr.toUpperCase());
        n.setStatus(NotificationStatus.PENDING);
        n.setRead(false);
        notificationRepository.save(n);
        realtimeEventService.publishNotificationChanged(recipient.getId(), "INVITE_CREATED");
    }

    // ── Chấp nhận lời mời ────────────────────────────────────────────────────
    public void acceptInvite(Long notificationId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Thông báo không tồn tại"));

        if (!n.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Không có quyền xử lý thông báo này");
        }
        if (n.getType() != NotificationType.INVITE) {
            throw new RuntimeException("Đây không phải lời mời");
        }
        if (n.getStatus() != NotificationStatus.PENDING) {
            throw new RuntimeException("Lời mời này đã được xử lý");
        }

        Project project = projectRepository.findById(n.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project không còn tồn tại"));

        // Thêm user vào project (kiểm tra race condition)
        if (projectMemberRepository.findByProjectAndUser(project, user).isEmpty()) {
            ProjectMember pm = new ProjectMember();
            pm.setProject(project);
            pm.setUser(user);
            pm.setRole(Role.valueOf(n.getInviteRole()));
            projectMemberRepository.save(pm);
        }

        // Đánh dấu lời mời đã được chấp nhận
        n.setStatus(NotificationStatus.ACCEPTED);
        n.setRead(true);
        notificationRepository.save(n);
        realtimeEventService.publishNotificationChanged(user.getId(), "INVITE_ACCEPTED");
        realtimeEventService.publishProjectChanged(project, "MEMBER_JOINED", user.getId());

        // Gửi thông báo cho người mời
        if (n.getSender() != null) {
            Notification joinNotif = new Notification();
            joinNotif.setRecipient(n.getSender());
            joinNotif.setSender(user);
            joinNotif.setMessage(user.getUsername() + " đã tham gia vào project \"" + project.getName() + "\"");
            joinNotif.setType(NotificationType.JOIN);
            joinNotif.setProjectId(project.getId());
            joinNotif.setProjectName(project.getName());
            joinNotif.setRead(false);
            notificationRepository.save(joinNotif);
            realtimeEventService.publishNotificationChanged(n.getSender().getId(), "MEMBER_JOINED");
        }
    }

    // ── Từ chối lời mời ──────────────────────────────────────────────────────
    public void declineInvite(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Thông báo không tồn tại"));

        if (!n.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Không có quyền xử lý thông báo này");
        }
        if (n.getType() != NotificationType.INVITE || n.getStatus() != NotificationStatus.PENDING) {
            throw new RuntimeException("Không thể từ chối thông báo này");
        }

        n.setStatus(NotificationStatus.DECLINED);
        n.setRead(true);
        notificationRepository.save(n);
        realtimeEventService.publishNotificationChanged(userId, "INVITE_DECLINED");
    }

    // ── Lấy thông báo của tôi ────────────────────────────────────────────────
    public List<NotificationDTO> getMyNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // ── Đánh dấu đã đọc ──────────────────────────────────────────────────────
    public void markAsRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Thông báo không tồn tại"));
        if (!n.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Không có quyền thao tác");
        }
        n.setRead(true);
        notificationRepository.save(n);
        realtimeEventService.publishNotificationChanged(userId, "MARK_AS_READ");
    }

    // ── Đánh dấu tất cả đã đọc ────────────────────────────────────────────────
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Notification> unreadNotifications = notificationRepository.findByRecipientAndReadFalse(user);
        for (Notification n : unreadNotifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
        realtimeEventService.publishNotificationChanged(userId, "MARK_ALL_AS_READ");
    }

    // ── Đếm chưa đọc ─────────────────────────────────────────────────────────
    public long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    // ── Nhắc nhở deadline sắp đến (chạy mỗi ngày, gọi từ DeadlineScheduler) ──
    public void sendDeadlineReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        List<TaskStatus> doneStatuses = Arrays.asList(TaskStatus.SUBMITTED, TaskStatus.DONE);

        List<Task> tasks = taskRepository.findByDeadlineAndAssignedToIsNotNullAndStatusNotIn(
                tomorrow, doneStatuses);

        for (Task task : tasks) {
            User recipient = task.getAssignedTo();
            // Tránh gửi thông báo trùng trong cùng 1 ngày
            boolean alreadySent = notificationRepository.existsByRecipientAndTypeAndTaskIdAndCreatedAtAfter(
                    recipient, NotificationType.DEADLINE_REMINDER, task.getId(), startOfToday);
            if (alreadySent)
                continue;

            Notification n = new Notification();
            n.setRecipient(recipient);
            n.setMessage("Task \"" + task.getTitle()
                    + "\" ở project \"" + task.getProject().getName()
                    + "\" sẽ hết hạn vào ngày " + tomorrow
                    + ", hãy nhanh chóng hoàn thành!");
            n.setType(NotificationType.DEADLINE_REMINDER);
            n.setProjectId(task.getProject().getId());
            n.setProjectName(task.getProject().getName());
            n.setTaskId(task.getId());
            n.setTaskName(task.getTitle());
            n.setRead(false);
            notificationRepository.save(n);
            realtimeEventService.publishNotificationChanged(recipient.getId(), "DEADLINE_REMINDER");
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private NotificationDTO convertToDTO(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setSenderUsername(n.getSender() != null ? n.getSender().getUsername() : null);
        dto.setMessage(n.getMessage());
        dto.setType(n.getType().name());
        dto.setProjectId(n.getProjectId());
        dto.setProjectName(n.getProjectName());
        dto.setInviteRole(n.getInviteRole());
        dto.setStatus(n.getStatus() != null ? n.getStatus().name() : null);
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        dto.setTaskId(n.getTaskId());
        dto.setTaskName(n.getTaskName());
        return dto;
    }
}
