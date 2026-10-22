package worksys.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import worksys.dto.*;
import worksys.entity.Project;
import worksys.entity.ProjectMember;
import worksys.entity.Role;
import worksys.repository.ProjectMemberRepository;
import worksys.repository.ProjectRepository;
import worksys.security.JwtUtil;
import worksys.service.AiService;
import worksys.service.TaskService;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller quản lý các tính năng Trí tuệ Nhân tạo (Google Gemini AI)
 * Bao gồm:
 * 1. POST /api/ai/project/{projectId}/chat: Chatbot hỗ trợ giải đáp & phân tích dự án
 * 2. POST /api/ai/project/{projectId}/decompose-task: AI tự động phân rã mục tiêu lớn thành các sub-tasks (WBS)
 * 3. POST /api/ai/project/{projectId}/batch-create: Lưu hàng loạt các sub-tasks đã duyệt vào Database & Kanban
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final TaskService taskService;
    private final JwtUtil jwtUtil;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public AiController(AiService aiService,
                        TaskService taskService,
                        JwtUtil jwtUtil,
                        ProjectRepository projectRepository,
                        ProjectMemberRepository projectMemberRepository) {
        this.aiService = aiService;
        this.taskService = taskService;
        this.jwtUtil = jwtUtil;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    /**
     * Helper: Trích xuất UserId từ JWT Authorization Bearer Header
     */
    private Long getCurrentUserId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized: Thiếu hoặc sai định dạng JWT Token");
        }
        return jwtUtil.extractUserId(header.substring(7));
    }

    /**
     * Helper: Kiểm tra quyền - Chỉ ADMIN hoặc MANAGER của dự án mới được sử dụng tính năng AI
     */
    private void checkAdminOrManagerPermission(Project project, Long userId) {
        Optional<ProjectMember> memberOpt = projectMemberRepository.findByProjectAndUser_Id(project, userId);
        if (memberOpt.isEmpty()) {
            throw new RuntimeException("Bạn không phải là thành viên của dự án này.");
        }
        Role role = memberOpt.get().getRole();
        if (role != Role.ADMIN && role != Role.MANAGER) {
            throw new RuntimeException("Chỉ ADMIN hoặc MANAGER mới có quyền sử dụng Trợ lý AI.");
        }
    }

    /**
     * Endpoint 1: Chatbot hỏi đáp & phân tích tình hình dự án
     */
    @PostMapping("/project/{projectId}/chat")
    public ResponseEntity<AiChatResponseDTO> chatAboutProject(
            @PathVariable Long projectId,
            @RequestBody AiChatRequestDTO requestDTO,
            HttpServletRequest request) {

        Long userId = getCurrentUserId(request);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        try {
            checkAdminOrManagerPermission(project, userId);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(new AiChatResponseDTO(e.getMessage()));
        }

        String responseText = aiService.analyzeProjectTasks(projectId, requestDTO.getPrompt());
        return ResponseEntity.ok(new AiChatResponseDTO(responseText));
    }

    /**
     * Endpoint 2: AI tự động phân rã một mục tiêu tính năng lớn thành danh sách 3-6 task con
     * Trả về danh sách gợi ý để Frontend hiển thị giao diện xem trước & chỉnh sửa.
     */
    @PostMapping("/project/{projectId}/decompose-task")
    public ResponseEntity<?> decomposeTask(
            @PathVariable Long projectId,
            @RequestBody AiTaskDecomposeRequestDTO requestDTO,
            HttpServletRequest request) {

        Long userId = getCurrentUserId(request);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        try {
            checkAdminOrManagerPermission(project, userId);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }

        if (requestDTO.getFeatureGoal() == null || requestDTO.getFeatureGoal().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mục tiêu tính năng (featureGoal) không được để trống"));
        }

        try {
            List<AiGeneratedSubTaskDTO> subTasks = aiService.decomposeFeature(projectId, requestDTO);
            return ResponseEntity.ok(subTasks);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Endpoint 3: Lưu hàng loạt các task con đã được duyệt vào cơ sở dữ liệu
     * Thực hiện Transactional Batch Insert và tự động đồng bộ lên Kanban qua WebSocket.
     */
    @PostMapping("/project/{projectId}/batch-create")
    public ResponseEntity<?> batchCreateTasks(
            @PathVariable Long projectId,
            @RequestBody AiBatchCreateTasksRequestDTO requestDTO,
            HttpServletRequest request) {

        Long userId = getCurrentUserId(request);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        try {
            checkAdminOrManagerPermission(project, userId);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }

        if (requestDTO.getTasks() == null || requestDTO.getTasks().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Danh sách task không được rỗng"));
        }

        try {
            List<TaskDTO> createdTasks = taskService.batchCreateTasks(projectId, requestDTO.getTasks());
            return ResponseEntity.ok(createdTasks);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
