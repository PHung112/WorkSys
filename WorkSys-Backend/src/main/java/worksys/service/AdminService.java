package worksys.service;

import org.springframework.security.access.AccessDeniedException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import worksys.dto.admin.AdminDashboardDTO;
import worksys.dto.admin.AdminProjectDTO;
import worksys.dto.admin.AdminUserDTO;
import worksys.entity.*;
import worksys.repository.ProjectMemberRepository;
import worksys.repository.ProjectRepository;
import worksys.repository.TaskRepository;
import worksys.repository.UserRepository;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public AdminService(UserRepository userRepository, ProjectRepository projectRepository, TaskRepository taskRepository, ProjectMemberRepository projectMemberRepository, AuditLogService auditLogService, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    private User requireSystemAdmin(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        if (user.getSystemRole() != SystemRole.SYSTEM_ADMIN) {
            throw new AccessDeniedException("Quyền truy cập bị từ chối: Cần quyền SYSTEM_ADMIN");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AccessDeniedException("Tài khoản của bạn đã bị vô hiệu hóa");
        }
        return user;
    }

    public AdminDashboardDTO getDashboard(String requestingUsername) {
        requireSystemAdmin(requestingUsername);

        AdminDashboardDTO dto = new AdminDashboardDTO();
        dto.totalUsers = userRepository.count();
        dto.activeUsers = userRepository.countBySystemRoleAndStatus(SystemRole.USER, UserStatus.ACTIVE) 
                          + userRepository.countBySystemRoleAndStatus(SystemRole.SYSTEM_ADMIN, UserStatus.ACTIVE);
        dto.totalProjects = projectRepository.count();
        dto.totalTasks = taskRepository.count();
        
        // Count tasks by status using standard Jpa methods (we need to add them or count manually if too many)
        // For simplicity, we can fetch all or write specific count queries. Since TaskRepository doesn't have countByStatus, we can just get all or add the method.
        // Let's just use findAll for now since it's a small project, or better, add count queries to TaskRepository later.
        // For now I'll set 0 and we can add them to TaskRepository.
        
        return dto;
    }

    public Page<AdminUserDTO> getUsers(String username, String keyword, SystemRole role, UserStatus status, Pageable pageable) {
        requireSystemAdmin(username);

        Page<User> usersPage;
        if (keyword != null && !keyword.isEmpty()) {
            usersPage = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, keyword, pageable);
        } else if (role != null) {
            usersPage = userRepository.findBySystemRole(role, pageable); // Need to add to repo
        } else if (status != null) {
            usersPage = userRepository.findByStatus(status, pageable); // Need to add to repo
        } else {
            usersPage = userRepository.findAll(pageable);
        }

        return usersPage.map(this::mapToAdminUserDTO);
    }

    private AdminUserDTO mapToAdminUserDTO(User user) {
        AdminUserDTO dto = new AdminUserDTO();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.email = user.getEmail();
        dto.avatarUrl = user.getAvatarUrl();
        dto.systemRole = user.getSystemRole();
        dto.status = user.getStatus();
        dto.createdAt = user.getCreatedAt();
        dto.projectCount = projectMemberRepository.findByUser(user).size();
        dto.taskCount = taskRepository.findByAssigneesContaining(user).size();
        return dto;
    }

    public Page<AdminProjectDTO> getProjects(String username, String keyword, Pageable pageable) {
        requireSystemAdmin(username);

        Page<Project> projectsPage;
        if (keyword != null && !keyword.isEmpty()) {
            projectsPage = projectRepository.findByNameContainingIgnoreCase(keyword, pageable);
        } else {
            projectsPage = projectRepository.findAll(pageable);
        }

        return projectsPage.map(this::mapToAdminProjectDTO);
    }

    private AdminProjectDTO mapToAdminProjectDTO(Project project) {
        AdminProjectDTO dto = new AdminProjectDTO();
        dto.id = project.getId();
        dto.name = project.getName();
        dto.description = project.getDescription();
        dto.adminName = project.getCreatedBy().getUsername();
        dto.createdAt = project.getCreatedAt();
        dto.archived = project.isArchived();
        
        dto.memberCount = projectMemberRepository.findByProject(project).size();
        
        var tasks = taskRepository.findByProject(project);
        dto.totalTasks = tasks.size();
        dto.completedTasks = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        dto.overdueTasks = tasks.stream().filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(java.time.LocalDate.now()) && t.getStatus() != TaskStatus.DONE).count();
        dto.progress = dto.totalTasks > 0 ? (double) dto.completedTasks / dto.totalTasks * 100 : 0;
        
        return dto;
    }

    @Transactional
    public void archiveProject(String username, Long projectId, boolean archived) {
        User admin = requireSystemAdmin(username);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project không tồn tại"));

        project.setArchived(archived);
        projectRepository.save(project);

        auditLogService.log(
                admin.getId(),
                admin.getUsername(),
                archived ? "PROJECT_ARCHIVED" : "PROJECT_RESTORED",
                "PROJECT",
                project.getId(),
                project.getName(),
                null
        );

        String message = archived ? 
            "Dự án của bạn đã bị khóa, vui lòng liên hệ admin để biết thêm chi tiết" : 
            "Dự án của bạn đã được mở khóa";
        notificationService.createSystemAlertNotification(project.getCreatedBy(), message);
    }

    @Transactional
    public void deleteProject(String username, Long projectId) {
        User admin = requireSystemAdmin(username);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project không tồn tại"));

        // Gửi thông báo cho chủ dự án trước khi xóa
        notificationService.createSystemAlertNotification(project.getCreatedBy(), 
            "Dự án của bạn đã bị xóa, vui lòng liên hệ admin để biết thêm chi tiết");

        // Ghi log
        auditLogService.log(
                admin.getId(),
                admin.getUsername(),
                "PROJECT_DELETED",
                "PROJECT",
                project.getId(),
                project.getName(),
                null
        );

        // Xóa data liên quan
        taskRepository.deleteAll(taskRepository.findByProject(project));
        projectMemberRepository.deleteAll(projectMemberRepository.findByProject(project));
        projectRepository.delete(project);
    }
    
    // User Management methods
    @Transactional
    public void updateUserStatus(String username, Long targetUserId, UserStatus newStatus) {
        User admin = requireSystemAdmin(username);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (admin.getId().equals(targetUser.getId()) && newStatus == UserStatus.INACTIVE) {
            throw new RuntimeException("Không thể tự vô hiệu hóa tài khoản của chính mình");
        }

        if (targetUser.getSystemRole() == SystemRole.SYSTEM_ADMIN && newStatus == UserStatus.INACTIVE) {
            long activeAdmins = userRepository.countBySystemRoleAndStatus(SystemRole.SYSTEM_ADMIN, UserStatus.ACTIVE);
            if (activeAdmins <= 1 && targetUser.getStatus() == UserStatus.ACTIVE) {
                throw new RuntimeException("Không thể vô hiệu hóa SYSTEM_ADMIN cuối cùng");
            }
        }

        targetUser.setStatus(newStatus);
        userRepository.save(targetUser);

        auditLogService.log(
                admin.getId(),
                admin.getUsername(),
                "USER_STATUS_CHANGED",
                "USER",
                targetUser.getId(),
                targetUser.getUsername(),
                "New status: " + newStatus.name()
        );
    }

    @Transactional
    public void updateUserSystemRole(String username, Long targetUserId, SystemRole newRole) {
        User admin = requireSystemAdmin(username);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (admin.getId().equals(targetUser.getId())) {
            throw new RuntimeException("Không thể tự thay đổi quyền của chính mình");
        }

        if (targetUser.getSystemRole() == SystemRole.SYSTEM_ADMIN && newRole == SystemRole.USER) {
            long activeAdmins = userRepository.countBySystemRoleAndStatus(SystemRole.SYSTEM_ADMIN, UserStatus.ACTIVE);
            if (activeAdmins <= 1) {
                throw new RuntimeException("Không thể gỡ quyền SYSTEM_ADMIN cuối cùng");
            }
        }

        targetUser.setSystemRole(newRole);
        userRepository.save(targetUser);

        auditLogService.log(
                admin.getId(),
                admin.getUsername(),
                "SYSTEM_ROLE_CHANGED",
                "USER",
                targetUser.getId(),
                targetUser.getUsername(),
                "New role: " + newRole.name()
        );
    }
}
