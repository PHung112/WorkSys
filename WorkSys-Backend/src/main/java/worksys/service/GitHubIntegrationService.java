package worksys.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import worksys.entity.Project;
import worksys.entity.Role;
import worksys.entity.User;
import worksys.repository.ProjectRepository;
import worksys.repository.UserRepository;

import java.util.*;

@Service
public class GitHubIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(GitHubIntegrationService.class);

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final CacheEvictionService cacheEvictionService;
    private final RealtimeEventService realtimeEventService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${github.client-id:}")
    private String githubClientId;

    @Value("${github.client-secret:}")
    private String githubClientSecret;

    @Value("${app.webhook.base-url:https://worksys-phung.loca.lt}")
    private String defaultWebhookBaseUrl;

    public GitHubIntegrationService(
            UserRepository userRepository,
            ProjectRepository projectRepository,
            ProjectService projectService,
            CacheEvictionService cacheEvictionService,
            RealtimeEventService realtimeEventService) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.cacheEvictionService = cacheEvictionService;
        this.realtimeEventService = realtimeEventService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Tạo HTTP Headers chuẩn cho GitHub REST API
     */
    private HttpHeaders createGitHubHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token.trim());
        headers.set("Accept", "application/vnd.github+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        headers.set("User-Agent", "WorkSys-App/1.0");
        return headers;
    }

    /**
     * Lấy trạng thái liên kết tài khoản GitHub của người dùng
     */
    public Map<String, Object> getUserGithubStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> result = new HashMap<>();
        boolean isConnected = user.getGithubAccessToken() != null && !user.getGithubAccessToken().isBlank();
        result.put("connected", isConnected);
        result.put("username", user.getGithubUsername());
        result.put("hasOAuthConfig", githubClientId != null && !githubClientId.isBlank());
        result.put("defaultWebhookBaseUrl", defaultWebhookBaseUrl);
        return result;
    }

    /**
     * Xác thực và lưu Personal Access Token (PAT) hoặc OAuth Access Token vào tài khoản người dùng
     */
    @Transactional
    public Map<String, Object> connectToken(Long userId, String token) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("GitHub Access Token không được để trống");
        }

        try {
            HttpHeaders headers = createGitHubHeaders(token);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.github.com/user",
                    HttpMethod.GET,
                    request,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String login = root.path("login").asText("");
            String avatarUrl = root.path("avatar_url").asText("");

            if (login.isBlank()) {
                throw new RuntimeException("Không tìm thấy thông tin tài khoản GitHub tương ứng với Token này");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setGithubAccessToken(token.trim());
            user.setGithubUsername(login);
            userRepository.save(user);

            log.info("Người dùng ID {} đã liên kết thành công với tài khoản GitHub: @{}", userId, login);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("username", login);
            result.put("avatarUrl", avatarUrl);
            result.put("message", "Kết nối tài khoản GitHub @" + login + " thành công!");
            return result;

        } catch (HttpClientErrorException.Unauthorized e) {
            log.error("GitHub Token không hợp lệ hoặc đã hết hạn: {}", e.getMessage());
            throw new RuntimeException("GitHub Token không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại quyền truy cập.");
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra GitHub Token: {}", e.getMessage());
            throw new RuntimeException("Không thể kết nối tới GitHub: " + e.getMessage());
        }
    }

    /**
     * Ngắt kết nối tài khoản GitHub của người dùng
     */
    @Transactional
    public Map<String, Object> disconnectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setGithubAccessToken(null);
        user.setGithubUsername(null);
        userRepository.save(user);

        log.info("Người dùng ID {} đã ngắt kết nối tài khoản GitHub", userId);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Đã ngắt kết nối tài khoản GitHub");
        return result;
    }

    /**
     * Lấy danh sách các Repository GitHub của người dùng (để hiển thị dropdown 1-click)
     */
    public List<Map<String, Object>> getUserRepositories(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = user.getGithubAccessToken();
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Vui lòng kết nối tài khoản GitHub trước để lấy danh sách Repositories");
        }

        try {
            HttpHeaders headers = createGitHubHeaders(token);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            String url = "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member";
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            List<Map<String, Object>> repos = new ArrayList<>();

            if (root.isArray()) {
                for (JsonNode repoNode : root) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", repoNode.path("id").asLong());
                    item.put("name", repoNode.path("name").asText());
                    item.put("fullName", repoNode.path("full_name").asText());
                    item.put("isPrivate", repoNode.path("private").asBoolean(false));
                    item.put("htmlUrl", repoNode.path("html_url").asText());
                    item.put("description", repoNode.path("description").asText(""));
                    item.put("defaultBranch", repoNode.path("default_branch").asText("main"));
                    item.put("updatedAt", repoNode.path("updated_at").asText(""));

                    repos.add(item);
                }
            }

            return repos;

        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách GitHub Repositories: {}", e.getMessage());
            throw new RuntimeException("Không thể lấy danh sách GitHub Repositories: " + e.getMessage());
        }
    }

    /**
     * KÍCH HOẠT WEBHOOK 1-CLICK:
     * Tự động gọi GitHub API tạo Webhook trên repository được chọn, lưu secret và id vào database
     */
    @Transactional
    public Map<String, Object> autoConnectProject(Long projectId, Long actorId, String repoFullName, String customWebhookUrl) {
        Role role = projectService.getMemberRole(projectId, actorId);
        if (role != Role.ADMIN && role != Role.MANAGER) {
            throw new RuntimeException("Chỉ ADMIN hoặc MANAGER mới có quyền kết nối GitHub cho dự án");
        }

        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = actor.getGithubAccessToken();
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Tài khoản của bạn chưa kết nối GitHub Token. Hãy kết nối trước khi tạo Webhook tự động.");
        }

        String cleanRepo = ProjectService.cleanGithubRepo(repoFullName);
        if (cleanRepo == null || cleanRepo.isBlank()) {
            throw new RuntimeException("Tên repository GitHub không hợp lệ (cần định dạng owner/repo)");
        }

        // Xác định Payload Webhook URL
        String baseUrl = (customWebhookUrl != null && !customWebhookUrl.isBlank())
                ? customWebhookUrl.trim().replaceAll("/+$", "")
                : defaultWebhookBaseUrl.trim().replaceAll("/+$", "");

        String targetWebhookUrl = baseUrl.endsWith("/api/webhooks/github")
                ? baseUrl
                : baseUrl + "/api/webhooks/github";

        // Tạo secret ngẫu nhiên bảo mật HMAC
        String generatedSecret = UUID.randomUUID().toString().replace("-", "");

        try {
            HttpHeaders headers = createGitHubHeaders(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 1. Kiểm tra xem Webhook này đã tồn tại trên Repo chưa để tránh trùng lặp
            Long existingHookId = findExistingWebhookId(headers, cleanRepo, targetWebhookUrl);

            Long webhookId;

            if (existingHookId != null) {
                log.info("Webhook đã tồn tại trên repo {} với ID {}. Tiến hành cập nhật...", cleanRepo, existingHookId);
                // Cập nhật hook hiện tại
                Map<String, Object> updatePayload = new HashMap<>();
                updatePayload.put("active", true);
                updatePayload.put("events", List.of("push", "pull_request"));

                Map<String, Object> config = new HashMap<>();
                config.put("url", targetWebhookUrl);
                config.put("content_type", "json");
                config.put("secret", generatedSecret);
                config.put("insecure_ssl", "0");
                updatePayload.put("config", config);

                HttpEntity<Map<String, Object>> updateRequest = new HttpEntity<>(updatePayload, headers);
                restTemplate.exchange(
                        "https://api.github.com/repos/" + cleanRepo + "/hooks/" + existingHookId,
                        HttpMethod.PATCH,
                        updateRequest,
                        String.class
                );
                webhookId = existingHookId;
            } else {
                // 2. Tạo mới Webhook qua REST API
                log.info("Đang tạo Webhook mới trên repo {} trỏ về {}", cleanRepo, targetWebhookUrl);
                Map<String, Object> createPayload = new HashMap<>();
                createPayload.put("name", "web");
                createPayload.put("active", true);
                createPayload.put("events", List.of("push", "pull_request"));

                Map<String, Object> config = new HashMap<>();
                config.put("url", targetWebhookUrl);
                config.put("content_type", "json");
                config.put("secret", generatedSecret);
                config.put("insecure_ssl", "0");
                createPayload.put("config", config);

                HttpEntity<Map<String, Object>> createRequest = new HttpEntity<>(createPayload, headers);
                ResponseEntity<String> createResponse = restTemplate.exchange(
                        "https://api.github.com/repos/" + cleanRepo + "/hooks",
                        HttpMethod.POST,
                        createRequest,
                        String.class
                );

                JsonNode createdNode = objectMapper.readTree(createResponse.getBody());
                webhookId = createdNode.path("id").asLong();
            }

            // 3. Cập nhật thông tin vào Project
            Project project = projectService.getProjectById(projectId);
            project.setGithubRepo(cleanRepo);
            project.setGithubSecret(generatedSecret);
            project.setGithubWebhookId(webhookId);

            Project saved = projectRepository.save(project);
            cacheEvictionService.evictProjectDetails(projectId);
            realtimeEventService.publishProjectChanged(saved, "PROJECT_UPDATED", actorId);

            log.info("Đã kích hoạt Webhook 1-click thành công cho Project ID {} (Repo: {}, Hook ID: {})",
                    projectId, cleanRepo, webhookId);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("repo", cleanRepo);
            responseData.put("webhookId", webhookId);
            responseData.put("webhookUrl", targetWebhookUrl);
            responseData.put("project", saved);
            responseData.put("message", "Kích hoạt Webhook 1-Click thành công trên repository " + cleanRepo + "!");
            return responseData;

        } catch (HttpClientErrorException e) {
            log.error("Lỗi GitHub API khi tạo Webhook: Status {} - Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            String errorMsg = "Lỗi từ GitHub: " + e.getStatusCode();
            try {
                JsonNode errNode = objectMapper.readTree(e.getResponseBodyAsString());
                if (errNode.has("message")) {
                    errorMsg = errNode.get("message").asText();
                }
            } catch (Exception ignored) {}
            throw new RuntimeException(errorMsg);
        } catch (Exception e) {
            log.error("Lỗi khi tự động kích hoạt Webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể tự động tạo Webhook: " + e.getMessage());
        }
    }

    /**
     * Tìm xem Webhook đã tồn tại trên Repo chưa dựa vào targetWebhookUrl
     */
    private Long findExistingWebhookId(HttpHeaders headers, String cleanRepo, String targetWebhookUrl) {
        try {
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.github.com/repos/" + cleanRepo + "/hooks",
                    HttpMethod.GET,
                    request,
                    String.class
            );

            JsonNode hooks = objectMapper.readTree(response.getBody());
            if (hooks.isArray()) {
                for (JsonNode hook : hooks) {
                    String hookUrl = hook.path("config").path("url").asText("");
                    if (targetWebhookUrl.equalsIgnoreCase(hookUrl)) {
                        return hook.path("id").asLong();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Không thể kiểm tra danh sách Webhook hiện có trên repo {}: {}", cleanRepo, e.getMessage());
        }
        return null;
    }

    /**
     * NGẮT KẾT NỐI 1-CLICK:
     * Tự động xóa Webhook trên GitHub (nếu có hookId) và xóa cấu hình trong Project
     */
    @Transactional
    public Map<String, Object> disconnectProjectWebhook(Long projectId, Long actorId) {
        Role role = projectService.getMemberRole(projectId, actorId);
        if (role != Role.ADMIN && role != Role.MANAGER) {
            throw new RuntimeException("Chỉ ADMIN hoặc MANAGER mới có quyền ngắt kết nối GitHub");
        }

        Project project = projectService.getProjectById(projectId);
        String repo = project.getGithubRepo();
        Long webhookId = project.getGithubWebhookId();

        // Thử xóa webhook trên GitHub qua API nếu có token
        User actor = userRepository.findById(actorId).orElse(null);
        if (actor != null && actor.getGithubAccessToken() != null && repo != null && webhookId != null) {
            try {
                HttpHeaders headers = createGitHubHeaders(actor.getGithubAccessToken());
                HttpEntity<Void> request = new HttpEntity<>(headers);
                restTemplate.exchange(
                        "https://api.github.com/repos/" + repo + "/hooks/" + webhookId,
                        HttpMethod.DELETE,
                        request,
                        Void.class
                );
                log.info("Đã xóa Webhook ID {} trên GitHub repository {}", webhookId, repo);
            } catch (Exception e) {
                log.warn("Không thể xóa Webhook trên GitHub (có thể đã bị xóa trước đó): {}", e.getMessage());
            }
        }

        // Xóa cấu hình khỏi database
        project.setGithubRepo(null);
        project.setGithubSecret(null);
        project.setGithubWebhookId(null);

        Project saved = projectRepository.save(project);
        cacheEvictionService.evictProjectDetails(projectId);
        realtimeEventService.publishProjectChanged(saved, "PROJECT_UPDATED", actorId);

        log.info("Dự án ID {} đã ngắt kết nối với GitHub hoàn toàn", projectId);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("project", saved);
        result.put("message", "Đã ngắt kết nối và gỡ bỏ Webhook thành công!");
        return result;
    }

    /**
     * Trả về URL đăng nhập OAuth nếu có cấu hình Client ID
     */
    public String getOAuthAuthorizeUrl(String redirectUri) {
        if (githubClientId == null || githubClientId.isBlank()) {
            return null;
        }
        return "https://github.com/login/oauth/authorize?client_id=" + githubClientId
                + "&scope=repo,admin:repo_hook&redirect_uri=" + redirectUri;
    }

    /**
     * Trao đổi mã OAuth code lấy access token và liên kết vào tài khoản
     */
    @Transactional
    public Map<String, Object> exchangeOAuthCode(Long userId, String code) {
        if (githubClientId == null || githubClientSecret == null || githubClientId.isBlank()) {
            throw new RuntimeException("Hệ thống chưa cấu hình GITHUB_CLIENT_ID và GITHUB_CLIENT_SECRET");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/json");
            headers.set("User-Agent", "WorkSys-App/1.0");

            Map<String, String> body = new HashMap<>();
            body.put("client_id", githubClientId);
            body.put("client_secret", githubClientSecret);
            body.put("code", code);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://github.com/login/oauth/access_token",
                    request,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String accessToken = root.path("access_token").asText("");

            if (accessToken.isBlank()) {
                String errorDescription = root.path("error_description").asText("Không lấy được Access Token từ GitHub");
                throw new RuntimeException(errorDescription);
            }

            return connectToken(userId, accessToken);

        } catch (Exception e) {
            log.error("Lỗi trao đổi GitHub OAuth Code: {}", e.getMessage());
            throw new RuntimeException("Không thể hoàn tất đăng nhập GitHub OAuth: " + e.getMessage());
        }
    }
}
