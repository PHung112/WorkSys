package worksys.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import worksys.security.JwtUtil;
import worksys.service.GitHubIntegrationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/github")
public class GitHubIntegrationController {

    private final GitHubIntegrationService gitHubIntegrationService;
    private final JwtUtil jwtUtil;

    public GitHubIntegrationController(GitHubIntegrationService gitHubIntegrationService, JwtUtil jwtUtil) {
        this.gitHubIntegrationService = gitHubIntegrationService;
        this.jwtUtil = jwtUtil;
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized");
        }
        return jwtUtil.extractUserId(header.substring(7));
    }

    /**
     * Lấy trạng thái liên kết tài khoản GitHub của user hiện tại
     */
    @GetMapping("/status")
    public ResponseEntity<?> getStatus(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        return ResponseEntity.ok(gitHubIntegrationService.getUserGithubStatus(userId));
    }

    /**
     * Liên kết nhanh tài khoản GitHub bằng Personal Access Token (PAT)
     */
    @PostMapping("/connect-token")
    public ResponseEntity<?> connectToken(@RequestBody ConnectTokenRequest req, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            Map<String, Object> result = gitHubIntegrationService.connectToken(userId, req.token);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Ngắt kết nối tài khoản GitHub của người dùng
     */
    @PostMapping("/disconnect-user")
    public ResponseEntity<?> disconnectUser(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        return ResponseEntity.ok(gitHubIntegrationService.disconnectUser(userId));
    }

    /**
     * Lấy danh sách GitHub Repositories của tài khoản để đưa vào dropdown 1-Click
     */
    @GetMapping("/repos")
    public ResponseEntity<?> getRepositories(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            List<Map<String, Object>> repos = gitHubIntegrationService.getUserRepositories(userId);
            return ResponseEntity.ok(repos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * KÍCH HOẠT WEBHOOK 1-CLICK cho Dự án
     */
    @PostMapping("/projects/{projectId}/auto-connect")
    public ResponseEntity<?> autoConnectProject(
            @PathVariable Long projectId,
            @RequestBody AutoConnectRequest req,
            HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            Map<String, Object> result = gitHubIntegrationService.autoConnectProject(
                    projectId,
                    userId,
                    req.repoFullName,
                    req.customWebhookUrl
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * NGẮT KẾT NỐI 1-CLICK cho Dự án
     */
    @PostMapping("/projects/{projectId}/disconnect")
    public ResponseEntity<?> disconnectProject(
            @PathVariable Long projectId,
            HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            Map<String, Object> result = gitHubIntegrationService.disconnectProjectWebhook(projectId, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Lấy URL để khởi động luồng OAuth
     */
    @GetMapping("/oauth/authorize-url")
    public ResponseEntity<?> getOAuthAuthorizeUrl(@RequestParam String redirectUri) {
        String url = gitHubIntegrationService.getOAuthAuthorizeUrl(redirectUri);
        return ResponseEntity.ok(Map.of("url", url != null ? url : ""));
    }

    /**
     * Xử lý OAuth Code callback
     */
    @PostMapping("/oauth/callback")
    public ResponseEntity<?> handleOAuthCallback(
            @RequestBody OAuthCallbackRequest req,
            HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            Map<String, Object> result = gitHubIntegrationService.exchangeOAuthCode(userId, req.code);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // DTOs
    public static class ConnectTokenRequest {
        public String token;
    }

    public static class AutoConnectRequest {
        public String repoFullName;
        public String customWebhookUrl;
    }

    public static class OAuthCallbackRequest {
        public String code;
    }
}
