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

    // Tạo task mới
    public Task createTask(Long projectId, List<Long> assigneeIds, String title, String description, LocalDate deadline) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (deadline != null && !deadline.isAfter(LocalDate.now())) {
            throw new RuntimeException("Deadline phải ít nhất là ngày mai");
        }

        if (assigneeIds == null || assigneeIds.isEmpty()) {
            throw new RuntimeException("Phải giao task cho ít nhất 1 người");
        }

        Task task = new Task();
        task.setProject(project);
        task.setTitle(title);
        task.setDescription(description);
        task.setDeadline(deadline);
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

    // Lấy tasks theo project
    public List<Task> getTasksByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return taskRepository.findByProject(project);
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

        if (deadline != null && !deadline.isAfter(LocalDate.now())) {
            throw new RuntimeException("Deadline phải ít nhất là ngày mai");
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

    // Helper method: Convert Task sang TaskDTO
    private TaskDTO convertToDTO(Task task) {
        boolean late = task.getDeadline() != null && task.getSubmittedAt() != null
                && task.getSubmittedAt().toLocalDate().isAfter(task.getDeadline());
        
        List<TaskDTO.AssigneeDTO> assignees = task.getAssignees().stream()
                .map(u -> new TaskDTO.AssigneeDTO(u.getId(), u.getUsername(), u.getEmail()))
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
        return dto;
    }

    // Tạo task mới - trả về DTO
    public TaskDTO createTaskDTO(Long projectId, List<Long> assigneeIds, String title, String description,
            LocalDate deadline) {
        Task task = createTask(projectId, assigneeIds, title, description, deadline);
        return convertToDTO(task);
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
}
