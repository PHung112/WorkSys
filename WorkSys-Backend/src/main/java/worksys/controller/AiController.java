package worksys.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import worksys.dto.AiChatRequestDTO;
import worksys.dto.AiChatResponseDTO;
import worksys.entity.Project;
import worksys.entity.ProjectMember;
import worksys.entity.Role;
import worksys.repository.ProjectMemberRepository;
import worksys.repository.ProjectRepository;
import worksys.security.JwtUtil;
import worksys.service.AiService;

import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final JwtUtil jwtUtil;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public AiController(AiService aiService, JwtUtil jwtUtil, 
                        ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository) {
        this.aiService = aiService;
        this.jwtUtil = jwtUtil;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized");
        }
        return jwtUtil.extractUserId(header.substring(7));
    }

    @PostMapping("/project/{projectId}/chat")
    public ResponseEntity<AiChatResponseDTO> chatAboutProject(
            @PathVariable Long projectId,
            @RequestBody AiChatRequestDTO requestDTO,
            HttpServletRequest request) {
        
        Long userId = getCurrentUserId(request);
        
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
                
        Optional<ProjectMember> memberOpt = projectMemberRepository.findByProjectAndUser_Id(project, userId);
        if (memberOpt.isEmpty()) {
            return ResponseEntity.status(403).body(new AiChatResponseDTO("Bạn không phải là thành viên của dự án này."));
        }
        
        Role role = memberOpt.get().getRole();
        if (role != Role.ADMIN && role != Role.MANAGER) {
            return ResponseEntity.status(403).body(new AiChatResponseDTO("Chỉ ADMIN hoặc MANAGER mới có quyền sử dụng Trợ lý AI."));
        }

        String responseText = aiService.analyzeProjectTasks(projectId, requestDTO.getPrompt());
        return ResponseEntity.ok(new AiChatResponseDTO(responseText));
    }
}
