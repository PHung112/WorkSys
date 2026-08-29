package worksys.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
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

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
            UserRepository userRepository, ProjectMemberRepository projectMemberRepository,
            NotificationService notificationService,
            RealtimeEventService realtimeEventService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.notificationService = notificationService;
        this.realtimeEventService = realtimeEventService;
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

    // Tự động archive các task DONE sau 2 ngày
    public void autoArchiveTasks() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(2);
        
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
            realtimeEventService.publishProjectChanged(t.getProject(), "TASK_ARCHIVED", null);
        }
    }
}
