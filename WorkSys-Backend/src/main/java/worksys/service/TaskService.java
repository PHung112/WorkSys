package worksys.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import worksys.dto.ProjectAnalyticsDTO;
import worksys.dto.TaskDTO;
import worksys.entity.*;
import worksys.repository.ProjectMemberRepository;
import worksys.repository.TaskRepository;
import worksys.repository.ProjectRepository;
import worksys.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;
    private final RealtimeEventService realtimeEventService;
    private final CacheEvictionService cacheEvictionService;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
            UserRepository userRepository, ProjectMemberRepository projectMemberRepository,
            NotificationService notificationService,
            RealtimeEventService realtimeEventService,
            CacheEvictionService cacheEvictionService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.notificationService = notificationService;
        this.realtimeEventService = realtimeEventService;
        this.cacheEvictionService = cacheEvictionService;
    }

    // Lấy current user từ JWT SecurityContext
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    // Tạo task mới (hỗ trợ đính kèm file/tài liệu mô tả chi tiết nhiệm vụ)
    public Task createTask(Long projectId, List<Long> assigneeIds, String title, String description, LocalDate deadline, String attachmentUrl) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Kiểm tra deadline: cho phép chọn từ ngày hôm nay trở đi (không được chọn ngày trong quá khứ)
        if (deadline != null && deadline.isBefore(LocalDate.now())) {
            throw new RuntimeException("Deadline không được ở trong quá khứ");
        }

        if (assigneeIds == null || assigneeIds.isEmpty()) {
            throw new RuntimeException("Phải giao task cho ít nhất 1 người");
        }

        Task task = new Task();
        task.setProject(project);
        task.setTitle(title);
        task.setDescription(description);
        task.setDeadline(deadline);
        task.setAttachmentUrl(attachmentUrl);
        task.setStatus(TaskStatus.TODO);

        java.util.Set<User> assignees = new java.util.HashSet<>();
        for (Long assigneeId : assigneeIds) {
            User assignedTo = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + assigneeId));
            assignees.add(assignedTo);
        }
        task.setAssignees(assignees);

        Task saved = taskRepository.save(task);

        // Gửi thông báo cho những người được giao task
        User currentUser = getCurrentUser();
        for (User assignee : saved.getAssignees()) {
            notificationService.createTaskAssignedNotification(
                    saved.getId(), saved.getTitle(),
                    project.getId(), project.getName(),
                    currentUser.getId(), assignee.getId());
        }

        Long actorUserId = null;
        try {
            actorUserId = getCurrentUser().getId();
        } catch (Exception ignored) {
            // keep null actor for system-triggered changes
        }
        cacheEvictionService.evictProjectAnalytics(project.getId());
        realtimeEventService.publishProjectChanged(project, "TASK_CREATED", actorUserId);

        return saved;
    }

    // Lấy task theo ID
    public Task getTaskById(Long id) {
        return taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
    }

    // Lấy tất cả task
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    // Lấy tasks theo project (chỉ lấy task CHƯA archive — dùng cho Kanban board)
    public List<Task> getTasksByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return taskRepository.findByProjectAndArchivedFalse(project);
    }

    // Lấy tasks đã archive theo project (dùng cho trang kho lưu trữ)
    public List<TaskDTO> getArchivedTasksByProjectDTO(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return taskRepository.findByProjectAndArchivedTrue(project).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Lấy tasks theo user
    public List<Task> getTasksByUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return taskRepository.findByAssigneesContaining(user);
    }

    // Cập nhật task - chỉ ADMIN/MANAGER được sửa khi task chưa giao; sau khi đã
    // giao không ai được sửa
    public Task updateTask(Long id, String title, String description, LocalDate deadline) {
        Task task = getTaskById(id);
        User currentUser = getCurrentUser();

        // Kiểm tra deadline khi cập nhật: cho phép từ hôm nay trở đi
        if (deadline != null && deadline.isBefore(LocalDate.now())) {
            throw new RuntimeException("Deadline không được ở trong quá khứ");
        }

        if (!task.getAssignees().isEmpty()) {
            // Task đã giao: không ai được sửa (theo logic cũ, có giao là không được sửa)
            throw new RuntimeException("Task đã được giao, không thể chỉnh sửa");
        }

        // Task chưa giao: chỉ ADMIN/MANAGER của project mới được sửa
        ProjectMember pm = projectMemberRepository
                .findByProjectAndUser(task.getProject(), currentUser)
                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên dự án này"));
        if (pm.getRole() == Role.MEMBER) {
            throw new RuntimeException("Chỉ ADMIN/MANAGER mới được chỉnh sửa task");
        }

        if (title != null)
            task.setTitle(title);
        if (description != null)
            task.setDescription(description);
        if (deadline != null)
            task.setDeadline(deadline);
        Task updated = taskRepository.save(task);
        cacheEvictionService.evictProjectAnalytics(updated.getProject().getId());
        realtimeEventService.publishProjectChanged(updated.getProject(), "TASK_UPDATED", currentUser.getId());
        return updated;
    }

    // Xóa task - chỉ ADMIN của project mới xóa được
    public void deleteTask(Long id) {
        Task task = getTaskById(id);
        User currentUser = getCurrentUser();

        ProjectMember pm = projectMemberRepository
                .findByProjectAndUser(task.getProject(), currentUser)
                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên dự án này"));
        if (pm.getRole() != Role.ADMIN) {
            throw new RuntimeException("Chỉ ADMIN mới được xóa task");
        }

        Project project = task.getProject();
        taskRepository.deleteById(id);
        cacheEvictionService.evictProjectAnalytics(project.getId());
        realtimeEventService.publishProjectChanged(project, "TASK_DELETED", currentUser.getId());
    }

    // Member nhận task
    public Task acceptTask(Long taskId, Long memberId) {
        Task task = getTaskById(taskId);

        boolean isAssignee = task.getAssignees().stream().anyMatch(u -> u.getId().equals(memberId));
        if (!isAssignee) {
            throw new RuntimeException("Member is not assigned to this task");
        }

        User user = userRepository.findById(memberId).orElseThrow();
        task.getAcceptedUsers().add(user);

        // Chỉ chuyển sang IN_PROGRESS khi tất cả những người được giao đều đã nhận
        if (task.getAcceptedUsers().size() == task.getAssignees().size()) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }
        
        Task saved = taskRepository.save(task);
        cacheEvictionService.evictProjectAnalytics(saved.getProject().getId());

        // Gửi thông báo cho người đã giao task (lấy current user qua SecurityContext)
        try {
            User acceptor = getCurrentUser();
            // Tìm ADMIN của project để thông báo
            projectMemberRepository.findByProject(task.getProject()).stream()
                    .filter(pm -> pm.getRole() == Role.ADMIN)
                    .map(pm -> pm.getUser().getId())
                    .findFirst()
                    .ifPresent(adminId -> notificationService.createTaskAcceptedNotification(
                            saved.getId(), saved.getTitle(),
                            task.getProject().getId(), task.getProject().getName(),
                            acceptor.getId(), adminId));
        } catch (Exception ignored) {
        }

        realtimeEventService.publishProjectChanged(saved.getProject(), "TASK_ACCEPTED", memberId);

        return saved;
    }

    // Member nộp task (chuyển sang SUBMITTED) + lưu link/file
    public Task submitTask(Long taskId, Long memberId, String submissionLink) {
        Task task = getTaskById(taskId);

        boolean isAssignee = task.getAssignees().stream().anyMatch(u -> u.getId().equals(memberId));
        if (!isAssignee) {
            throw new RuntimeException("Member is not assigned to this task");
        }

        if (submissionLink != null && !submissionLink.isBlank()) {
            task.setSubmissionLink(submissionLink.trim());
        }
        task.setSubmittedAt(LocalDateTime.now());
        task.setStatus(TaskStatus.SUBMITTED);
        Task saved = taskRepository.save(task);
        cacheEvictionService.evictProjectAnalytics(saved.getProject().getId());
        realtimeEventService.publishProjectChanged(saved.getProject(), "TASK_SUBMITTED", memberId);
        return saved;
    }

    // Hủy nộp task: xóa bài nộp cũ, đặt lại submissionLink và submittedAt về null,
    // sau đó chuyển trạng thái task từ SUBMITTED → IN_PROGRESS để thành viên có thể nộp lại.
    public Task unsubmitTask(Long taskId, Long memberId) {
        Task task = getTaskById(taskId);

        boolean isAssignee = task.getAssignees().stream().anyMatch(u -> u.getId().equals(memberId));
        if (!isAssignee) {
            throw new RuntimeException("Member is not assigned to this task");
        }
        if (task.getStatus() != TaskStatus.SUBMITTED) {
            throw new RuntimeException("Chỉ có thể hủy bài nộp khi đang ở trạng thái SUBMITTED");
        }

        task.setSubmissionLink(null);
        task.setSubmittedAt(null);
        task.setStatus(TaskStatus.IN_PROGRESS);
        Task saved = taskRepository.save(task);
        cacheEvictionService.evictProjectAnalytics(saved.getProject().getId());
        realtimeEventService.publishProjectChanged(saved.getProject(), "TASK_UNSUBMITTED", memberId);
        return saved;
    }

    // Cập nhật trạng thái task (Dành cho Admin / Manager kéo thả trực tiếp trên Kanban)
    public Task updateTaskStatus(Long id, TaskStatus newStatus) {
        Task task = getTaskById(id);
        User currentUser = getCurrentUser();

        // Kiểm tra quyền: Phải là ADMIN hoặc MANAGER của project chứa task
        ProjectMember pm = projectMemberRepository
                .findByProjectAndUser(task.getProject(), currentUser)
                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên dự án này"));
        if (pm.getRole() == Role.MEMBER) {
            throw new RuntimeException("Chỉ ADMIN hoặc MANAGER mới có quyền đổi trạng thái task");
        }

        task.setStatus(newStatus);
        Task saved = taskRepository.save(task);
        cacheEvictionService.evictProjectAnalytics(saved.getProject().getId());
        realtimeEventService.publishProjectChanged(saved.getProject(), "TASK_STATUS_UPDATED", currentUser.getId());
        return saved;
    }

    // Helper method: Convert Task sang TaskDTO
    private TaskDTO convertToDTO(Task task) {
        boolean late = task.getDeadline() != null && task.getSubmittedAt() != null
                && task.getSubmittedAt().toLocalDate().isAfter(task.getDeadline());
        
        List<TaskDTO.AssigneeDTO> assignees = task.getAssignees().stream()
                .map(u -> new TaskDTO.AssigneeDTO(u.getId(), u.getUsername(), u.getEmail(), u.getAvatarUrl()))
                .collect(Collectors.toList());
        List<Long> acceptedUserIds = task.getAcceptedUsers().stream()
                .map(User::getId)
                .collect(Collectors.toList());

        TaskDTO dto = new TaskDTO(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDeadline() != null ? task.getDeadline().toString() : null,
                task.getStatus().name(),
                task.getProject().getId(),
                task.getProject().getName(),
                assignees,
                acceptedUserIds,
                task.getSubmissionLink());
        dto.setSubmittedAt(task.getSubmittedAt() != null ? task.getSubmittedAt().toString() : null);
        dto.setLate(late);
        dto.setAttachmentUrl(task.getAttachmentUrl());
        dto.setCreatedAt(task.getCreatedAt() != null ? task.getCreatedAt().toString() : null);
        // Gắn thông tin archive vào DTO
        dto.setArchived(task.isArchived());
        dto.setArchivedAt(task.getArchivedAt() != null ? task.getArchivedAt().toString() : null);
        return dto;
    }

    // Tạo task mới kèm file đính kèm - trả về DTO
    public TaskDTO createTaskDTO(Long projectId, List<Long> assigneeIds, String title, String description,
            LocalDate deadline, String attachmentUrl) {
        Task task = createTask(projectId, assigneeIds, title, description, deadline, attachmentUrl);
        return convertToDTO(task);
    }

    // Overload tạo task mới không có file đính kèm - trả về DTO
    public TaskDTO createTaskDTO(Long projectId, List<Long> assigneeIds, String title, String description,
            LocalDate deadline) {
        return createTaskDTO(projectId, assigneeIds, title, description, deadline, null);
    }

    // Lấy task theo ID - trả về DTO
    public TaskDTO getTaskByIdDTO(Long id) {
        Task task = getTaskById(id);
        return convertToDTO(task);
    }

    // Lấy tất cả tasks - trả về DTO
    public List<TaskDTO> getAllTasksDTO() {
        return taskRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Lấy tasks theo project - trả về DTO
    public List<TaskDTO> getTasksByProjectDTO(Long projectId) {
        return getTasksByProject(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Lấy tasks theo user - trả về DTO
    public List<TaskDTO> getTasksByUserDTO(Long userId) {
        return getTasksByUser(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Cập nhật task - trả về DTO
    public TaskDTO updateTaskDTO(Long id, String title, String description, LocalDate deadline) {
        Task task = updateTask(id, title, description, deadline);
        return convertToDTO(task);
    }

    // Cập nhật trạng thái task - trả về DTO
    public TaskDTO updateTaskStatusDTO(Long id, TaskStatus newStatus) {
        Task task = updateTaskStatus(id, newStatus);
        return convertToDTO(task);
    }

    // Member nhận task - trả về DTO
    public TaskDTO acceptTaskDTO(Long taskId, Long memberId) {
        Task task = acceptTask(taskId, memberId);
        return convertToDTO(task);
    }

    // Member nộp task - trả về DTO
    public TaskDTO submitTaskDTO(Long taskId, Long memberId, String submissionLink) {
        Task task = submitTask(taskId, memberId, submissionLink);
        return convertToDTO(task);
    }

    // Wrapper gọi unsubmitTask() và chuyển kết quả sang DTO để trả về cho Controller.
    public TaskDTO unsubmitTaskDTO(Long taskId, Long memberId) {
        Task task = unsubmitTask(taskId, memberId);
        return convertToDTO(task);
    }

    // Tự động archive các task DONE sau 7 ngày
    public void autoArchiveTasks() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        
        // 1. Task có submittedAt (Member nộp)
        List<Task> tasksWithSubmit = taskRepository.findDoneTasksToArchive(cutoff);
        // 2. Task không có submittedAt (Admin mark done trực tiếp), dùng deadline làm mốc
        List<Task> tasksWithoutSubmit = taskRepository.findDoneTasksWithoutSubmitToArchive(cutoff);
        
        java.util.Set<Task> tasksToArchive = new java.util.HashSet<>();
        tasksToArchive.addAll(tasksWithSubmit);
        tasksToArchive.addAll(tasksWithoutSubmit);

        for (Task t : tasksToArchive) {
            t.setArchived(true);
            t.setArchivedAt(LocalDateTime.now());
            // Trạng thái lưu tên task [ trạng thái ] theo yêu cầu, có thể lưu vào db nếu cần 
            // nhưng thực tế FE có thể render theo dạng "Tên Task [DONE]" dựa vào status.
            taskRepository.save(t);
            cacheEvictionService.evictProjectAnalytics(t.getProject().getId());
            realtimeEventService.publishProjectChanged(t.getProject(), "TASK_ARCHIVED", null);
        }
    }

    // Tính toán số liệu phân tích và báo cáo hiệu suất dự án (Cache-Aside: TTL 10 phút)
    @Cacheable(value = "project_analytics", key = "#projectId")
    @Transactional(readOnly = true)
    public ProjectAnalyticsDTO getProjectAnalytics(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Task> allTasks = taskRepository.findByProject(project);
        List<ProjectMember> members = projectMemberRepository.findByProject(project);

        LocalDate today = LocalDate.now();

        // 1. Tính toán KPI
        long totalTasks = allTasks.size();
        long completedTasks = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        long inProgressTasks = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS && !t.isArchived()).count();
        long todoTasks = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO && !t.isArchived()).count();
        long submittedTasks = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.SUBMITTED && !t.isArchived()).count();
        long overdueTasks = allTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && !t.isArchived() && t.getDeadline() != null && t.getDeadline().isBefore(today))
                .count();

        double completionRate = totalTasks > 0 ? Math.round((completedTasks * 100.0 / totalTasks) * 10.0) / 10.0 : 0.0;

        // Tỷ lệ hoàn thành đúng hạn (trong số các task đã DONE)
        long onTimeCompleted = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .filter(t -> {
                    if (t.getDeadline() == null) return true;
                    if (t.getSubmittedAt() != null) {
                        return !t.getSubmittedAt().toLocalDate().isAfter(t.getDeadline());
                    }
                    return true;
                })
                .count();
        double onTimeRate = completedTasks > 0 ? Math.round((onTimeCompleted * 100.0 / completedTasks) * 10.0) / 10.0 : 100.0;

        // Thời gian hoàn thành trung bình (ngày)
        double avgCompletionDays = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null)
                .mapToLong(t -> {
                    LocalDateTime finishTime = t.getSubmittedAt() != null ? t.getSubmittedAt() : LocalDateTime.now();
                    return Math.max(1, java.time.Duration.between(t.getCreatedAt(), finishTime).toDays());
                })
                .average()
                .orElse(0.0);
        avgCompletionDays = Math.round(avgCompletionDays * 10.0) / 10.0;

        ProjectAnalyticsDTO.KpiDTO kpi = new ProjectAnalyticsDTO.KpiDTO(
                totalTasks, completedTasks, inProgressTasks, todoTasks, submittedTasks,
                overdueTasks, completionRate, onTimeRate, avgCompletionDays
        );

        // 2. Cơ cấu trạng thái công việc (Status Breakdown)
        List<ProjectAnalyticsDTO.StatusBreakdownDTO> statusBreakdown = List.of(
                new ProjectAnalyticsDTO.StatusBreakdownDTO("Cần làm", "TODO", todoTasks, "#94a3b8"),
                new ProjectAnalyticsDTO.StatusBreakdownDTO("Đang làm", "IN_PROGRESS", inProgressTasks, "#38bdf8"),
                new ProjectAnalyticsDTO.StatusBreakdownDTO("Chờ duyệt", "SUBMITTED", submittedTasks, "#c084fc"),
                new ProjectAnalyticsDTO.StatusBreakdownDTO("Hoàn thành", "DONE", completedTasks, "#22c55e")
        );

        // 3. Khối lượng công việc theo từng thành viên (Member Workloads)
        List<ProjectAnalyticsDTO.MemberWorkloadDTO> memberWorkloads = members.stream().map(pm -> {
            User u = pm.getUser();
            List<Task> userTasks = allTasks.stream()
                    .filter(t -> t.getAssignees() != null && t.getAssignees().contains(u))
                    .toList();

            long totalAssigned = userTasks.size();
            long userCompleted = userTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            long userInProgress = userTasks.stream().filter(t -> (t.getStatus() == TaskStatus.IN_PROGRESS || t.getStatus() == TaskStatus.SUBMITTED) && !t.isArchived()).count();
            long userOverdue = userTasks.stream()
                    .filter(t -> t.getStatus() != TaskStatus.DONE && !t.isArchived() && t.getDeadline() != null && t.getDeadline().isBefore(today))
                    .count();

            long userOnTime = userTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE)
                    .filter(t -> t.getDeadline() == null || (t.getSubmittedAt() != null && !t.getSubmittedAt().toLocalDate().isAfter(t.getDeadline())))
                    .count();
            double userOnTimeRate = userCompleted > 0 ? Math.round((userOnTime * 100.0 / userCompleted) * 10.0) / 10.0 : 100.0;

            return new ProjectAnalyticsDTO.MemberWorkloadDTO(
                    u.getId(),
                    u.getUsername(),
                    u.getEmail(),
                    u.getAvatarUrl(),
                    pm.getRole() != null ? pm.getRole().name() : "MEMBER",
                    totalAssigned,
                    userCompleted,
                    userInProgress,
                    userOverdue,
                    userOnTimeRate
            );
        }).sorted((m1, m2) -> Long.compare(m2.getCompletedCount(), m1.getCompletedCount())).toList();

        // 4. Xu hướng hoàn thành trong 14 ngày gần nhất (Completion Trend)
        List<ProjectAnalyticsDTO.CompletionTrendDTO> completionTrend = new java.util.ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String label = d.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM"));
            long createdCount = allTasks.stream()
                    .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toLocalDate().isEqual(d))
                    .count();
            long completedCount = allTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE && t.getSubmittedAt() != null && t.getSubmittedAt().toLocalDate().isEqual(d))
                    .count();
            completionTrend.add(new ProjectAnalyticsDTO.CompletionTrendDTO(label, completedCount, createdCount));
        }

        // 5. Các task sắp tới hạn hoặc đang trễ hạn cần chú ý (Top 6 tasks)
        List<ProjectAnalyticsDTO.UpcomingDeadlineDTO> upcomingDeadlines = allTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && !t.isArchived() && t.getDeadline() != null)
                .sorted(java.util.Comparator.comparing(Task::getDeadline))
                .limit(6)
                .map(t -> new ProjectAnalyticsDTO.UpcomingDeadlineDTO(
                        t.getId(),
                        t.getTitle(),
                        t.getDeadline(),
                        t.getStatus().name(),
                        t.getDeadline().isBefore(today),
                        t.getAssignees().stream().map(User::getUsername).toList()
                ))
                .toList();

        return new ProjectAnalyticsDTO(kpi, statusBreakdown, memberWorkloads, completionTrend, upcomingDeadlines);
    }
}
