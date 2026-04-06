package trandinhphihung_project.Task.Management.service;

import org.springframework.stereotype.Service;
import trandinhphihung_project.Task.Management.dto.ProjectMemberDTO;
import trandinhphihung_project.Task.Management.entity.Project;
import trandinhphihung_project.Task.Management.entity.ProjectMember;
import trandinhphihung_project.Task.Management.entity.Role;
import trandinhphihung_project.Task.Management.entity.User;
import trandinhphihung_project.Task.Management.repository.ProjectMemberRepository;
import trandinhphihung_project.Task.Management.repository.ProjectRepository;
import trandinhphihung_project.Task.Management.repository.UserRepository;

import trandinhphihung_project.Task.Management.repository.TaskRepository;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final RealtimeEventService realtimeEventService;

    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository,
            UserRepository userRepository, TaskRepository taskRepository, RealtimeEventService realtimeEventService) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.realtimeEventService = realtimeEventService;
    }

    // Tạo project mới
    public Project createProject(String name, String description, Long creatorId) {
        User creator = userRepository.findById(creatorId).orElseThrow(() -> new RuntimeException("User not found"));

        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setCreatedBy(creator);
        Project saved = projectRepository.save(project);

        // Creator là ADMIN
        ProjectMember pm = new ProjectMember();
        pm.setProject(saved);
        pm.setUser(creator);
        pm.setRole(Role.ADMIN);

        projectMemberRepository.save(pm);
        realtimeEventService.publishProjectChanged(saved, "PROJECT_CREATED", creatorId);

        return saved;
    }

    // Lấy tất cả projects
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    // Lấy projects mà user đang là thành viên
    public List<Project> getProjectsByUserId(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return projectMemberRepository.findByUser(user)
                .stream()
                .map(ProjectMember::getProject)
                .collect(Collectors.toList());
    }

    // Kiểm tra user có là thành viên của project không
    public boolean isMember(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);
        if (project == null || user == null)
            return false;
        return projectMemberRepository.findByProjectAndUser(project, user).isPresent();
    }

    // Lấy project theo ID
    public Project getProjectById(Long id) {
        return projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
    }

    // Cập nhật project
    public Project updateProject(Long id, String name, String description) {
        Project project = projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));

        if (name != null) {
            project.setName(name);
        }
        if (description != null) {
            project.setDescription(description);
        }

        Project updated = projectRepository.save(project);
        realtimeEventService.publishProjectChanged(updated, "PROJECT_UPDATED", null);
        return updated;
    }

    // Xóa project
    public void deleteProject(Long projectId, Long actorId) {
        Role actorRole = getMemberRole(projectId, actorId);
        if (actorRole != Role.ADMIN) {
            throw new RuntimeException("Chỉ Admin mới có quyền xóa project");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Long> memberIds = projectMemberRepository.findByProject(project).stream()
                .map(pm -> pm.getUser().getId())
                .collect(Collectors.toCollection(ArrayList::new));

        taskRepository.deleteAll(taskRepository.findByProject(project));
        projectMemberRepository.deleteAll(projectMemberRepository.findByProject(project));
        projectRepository.delete(project);

        for (Long memberId : memberIds) {
            realtimeEventService.publishProjectListChanged(memberId, projectId, "PROJECT_DELETED");
        }
    }

    // Lấy danh sách members của project
    public List<ProjectMember> getProjectMembers(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return projectMemberRepository.findByProject(project);
    }

    // Lấy danh sách members của project (DTO gọn gàng)
    public List<ProjectMemberDTO> getProjectMembersDTO(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        List<ProjectMember> members = projectMemberRepository.findByProject(project);

        return members.stream()
                .map(pm -> new ProjectMemberDTO(
                        pm.getId(),
                        pm.getUser().getId(),
                        pm.getUser().getUsername(),
                        pm.getUser().getEmail(),
                        pm.getRole().name()))
                .collect(Collectors.toList());
    }

    // Mời thành viên vào project
    public ProjectMember inviteMember(Long projectId, Long userId, String roleStr) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        // Kiểm tra member đã tồn tại chưa
        if (projectMemberRepository.findByProjectAndUser(project, user).isPresent()) {
            throw new RuntimeException("User is already a member of this project");
        }

        Role role = Role.valueOf(roleStr.toUpperCase());

        ProjectMember pm = new ProjectMember();
        pm.setProject(project);
        pm.setUser(user);
        pm.setRole(role);

        return projectMemberRepository.save(pm);
    }

    // Xóa member khỏi project
    public void removeMember(Long projectId, Long actorId, Long targetUserId) {
        if (!actorId.equals(targetUserId)) {
            Role actorRole = getMemberRole(projectId, actorId);
            if (actorRole != Role.ADMIN) {
                throw new RuntimeException(
                        "Chỉ Admin mới có quyền xóa thành viên khác. Bạn chỉ có thể tự rời project.");
            }
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ProjectMember pm = projectMemberRepository.findByProjectAndUser(project, targetUser)
                .orElseThrow(() -> new RuntimeException("Member not found in this project"));
        projectMemberRepository.delete(pm);

        realtimeEventService.publishProjectListChanged(targetUserId, projectId,
                actorId.equals(targetUserId) ? "MEMBER_LEFT" : "MEMBER_KICKED");
        realtimeEventService.publishProjectChanged(project,
                actorId.equals(targetUserId) ? "MEMBER_LEFT" : "MEMBER_KICKED", actorId);
    }

    // Thay đổi role của member
    public ProjectMember updateMemberRole(Long projectId, Long actorId, Long targetUserId, String roleStr) {
        Role actorRole = getMemberRole(projectId, actorId);
        Role newRole = Role.valueOf(roleStr.toUpperCase());

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ProjectMember targetPm = projectMemberRepository.findByProjectAndUser(project, targetUser)
                .orElseThrow(() -> new RuntimeException("Member not found in this project"));

        Role targetCurrentRole = targetPm.getRole();

        if (actorRole == Role.ADMIN) {
            // Admin không thể tự hạ cấp mình
            if (actorId.equals(targetUserId)) {
                throw new RuntimeException("Admin không thể tự thay đổi vai trò của mình");
            }

        } else if (actorRole == Role.MANAGER) {
            // Manager không thể đổi vai trò của chính mình
            if (actorId.equals(targetUserId)) {
                throw new RuntimeException("Manager không thể tự thay đổi vai trò của mình");
            }
            // Manager không được chỉnh Admin
            if (targetCurrentRole == Role.ADMIN) {
                throw new RuntimeException("Manager không có quyền thay đổi vai trò của Admin");
            }
            // Manager không được hạ cấp Manager khác (chỉ được nâng MEMBER → MANAGER)
            if (targetCurrentRole == Role.MANAGER) {
                throw new RuntimeException("Manager không có quyền thay đổi vai trò của Manager khác");
            }
            // Manager chỉ được nâng lên MANAGER
            if (newRole != Role.MANAGER) {
                throw new RuntimeException("Manager chỉ có thể nâng cấp Member lên Manager");
            }

        } else {
            throw new RuntimeException("Bạn không có quyền thay đổi vai trò thành viên");
        }

        targetPm.setRole(newRole);
        ProjectMember updated = projectMemberRepository.save(targetPm);
        realtimeEventService.publishProjectChanged(project, "MEMBER_ROLE_UPDATED", actorId);
        realtimeEventService.publishProjectListChanged(targetUserId, projectId, "MEMBER_ROLE_UPDATED");
        return updated;
    }

    // Lấy role của user trong project
    public Role getMemberRole(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return projectMemberRepository.findByProjectAndUser(project, user)
                .orElseThrow(() -> new RuntimeException("Member not found"))
                .getRole();
    }
}
