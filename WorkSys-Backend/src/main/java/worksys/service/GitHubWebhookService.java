package worksys.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import worksys.entity.Project;
import worksys.entity.Task;
import worksys.entity.TaskStatus;
import worksys.repository.ProjectRepository;
import worksys.repository.TaskRepository;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service xử lý sự kiện Webhook từ GitHub:
 * - Xác thực chữ ký HMAC-SHA256 (bảo mật chuẩn GitHub)
 * - Tự động phát hiện Smart Commits và Pull Requests
 * - Chuyển trạng thái task và đồng bộ realtime lên Kanban qua WebSocket STOMP
 */
@Service
public class GitHubWebhookService {

    private static final Logger log = LoggerFactory.getLogger(GitHubWebhookService.class);

    // Regex bắt các commit/PR đánh dấu hoàn thành: done #12, fix #12, closes #12, resolved 12
    private static final Pattern DONE_PATTERN = Pattern.compile(
            "(?i)(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved|done)\\s*#?(\\d+)");

    // Regex bắt các commit bắt đầu làm: start #12, doing #12, in-progress #12
    private static final Pattern PROGRESS_PATTERN = Pattern.compile(
            "(?i)(?:start|doing|progress)\\s*#?(\\d+)");

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final RealtimeEventService realtimeEventService;
    private final CacheEvictionService cacheEvictionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GitHubWebhookService(TaskRepository taskRepository,
                                ProjectRepository projectRepository,
                                RealtimeEventService realtimeEventService,
                                CacheEvictionService cacheEvictionService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.realtimeEventService = realtimeEventService;
        this.cacheEvictionService = cacheEvictionService;
    }

    /**
     * Xác thực chữ ký HMAC-SHA256 gửi trong header X-Hub-Signature-256 từ GitHub
     */
    public boolean verifySignature(String rawPayload, String signatureHeader, String secret) {
        if (secret == null || secret.isBlank()) {
            // Chế độ Dev (chưa cài secret): cho phép qua để test dễ dàng với ngrok
            return true;
        }
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            return false;
        }

        try {
            String expectedHash = signatureHeader.substring(7);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hmacBytes = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hmacBytes) {
                hex.append(String.format("%02x", b));
            }

            return MessageDigest.isEqual(
                    hex.toString().getBytes(StandardCharsets.UTF_8),
                    expectedHash.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Lỗi khi xác thực chữ ký GitHub Webhook HMAC: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Điểm tiếp nhận chính của Webhook, phân loại sự kiện (ping, push, pull_request)
     */
    @Transactional
    public Map<String, Object> handleWebhookEvent(String eventType, String rawPayload, String signatureHeader) {
        Map<String, Object> result = new HashMap<>();
        result.put("event", eventType);

        try {
            JsonNode rootNode = objectMapper.readTree(rawPayload);

            // Trích xuất thông tin Repository
            String repoFullName = "";
            if (rootNode.has("repository") && rootNode.get("repository").has("full_name")) {
                repoFullName = rootNode.get("repository").get("full_name").asText();
            }

            log.info("Nhận GitHub Webhook event: [{}] cho repository: [{}]", eventType, repoFullName);

            // Tìm dự án liên kết với Repo này (nếu có) để lấy secret kiểm tra
            List<Project> linkedProjects = projectRepository.findByGithubRepoIgnoreCase(repoFullName);
            if (!linkedProjects.isEmpty()) {
                Project firstProject = linkedProjects.get(0);
                if (firstProject.getGithubSecret() != null && !firstProject.getGithubSecret().isBlank()) {
                    boolean isValid = verifySignature(rawPayload, signatureHeader, firstProject.getGithubSecret());
                    if (!isValid) {
                        log.warn("Chữ ký X-Hub-Signature-256 không hợp lệ cho repository {}", repoFullName);
                        result.put("status", "UNAUTHORIZED");
                        result.put("message", "Invalid GitHub signature");
                        return result;
                    }
                }
            }

            // Phân nhánh xử lý theo loại sự kiện
            switch (eventType.toLowerCase()) {
                case "ping":
                    result.put("status", "PONG");
                    result.put("message", "Webhook kết nối thành công với WorkSys!");
                    break;

                case "push":
                    int updatedPushCount = handlePushEvent(rootNode, repoFullName);
                    result.put("status", "SUCCESS");
                    result.put("updatedTasks", updatedPushCount);
                    break;

                case "pull_request":
                    int updatedPrCount = handlePullRequestEvent(rootNode, repoFullName);
                    result.put("status", "SUCCESS");
                    result.put("updatedTasks", updatedPrCount);
                    break;

                default:
                    result.put("status", "IGNORED");
                    result.put("message", "Sự kiện " + eventType + " không yêu cầu cập nhật task.");
                    break;
            }

        } catch (Exception e) {
            log.error("Lỗi khi xử lý GitHub Webhook: {}", e.getMessage(), e);
            result.put("status", "ERROR");
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * Xử lý sự kiện Push (Commit code)
     */
    private int handlePushEvent(JsonNode rootNode, String repoFullName) {
        JsonNode commitsNode = rootNode.get("commits");
        if (commitsNode == null || !commitsNode.isArray()) {
            return 0;
        }

        int updatedCount = 0;
        Set<Long> processedTaskIds = new HashSet<>();

        for (JsonNode commit : commitsNode) {
            String message = commit.has("message") ? commit.get("message").asText() : "";
            String commitUrl = commit.has("url") ? commit.get("url").asText() : "";
            String authorName = commit.has("author") && commit.get("author").has("name")
                    ? commit.get("author").get("name").asText() : "GitHub Dev";

            log.info("Phân tích commit: \"{}\" bởi {}", message, authorName);

            // 1. Kiểm tra cú pháp DONE (done #15, fix #15, close #15, ...)
            // Theo quy trình: Commit xong chuyển sang SUBMITTED (Đã nộp), chờ Admin/Manager duyệt hoàn thành
            Matcher doneMatcher = DONE_PATTERN.matcher(message);
            while (doneMatcher.find()) {
                Long taskId = Long.parseLong(doneMatcher.group(1));
                if (processedTaskIds.add(taskId)) {
                    if (updateTaskToSubmitted(taskId, commitUrl, authorName)) {
                        updatedCount++;
                    }
                }
            }

            // 2. Kiểm tra cú pháp START / DOING (start #15, doing #15) - Tùy chọn bổ sung
            Matcher progressMatcher = PROGRESS_PATTERN.matcher(message);
            while (progressMatcher.find()) {
                Long taskId = Long.parseLong(progressMatcher.group(1));
                if (processedTaskIds.add(taskId)) {
                    if (updateTaskToInProgress(taskId, authorName)) {
                        updatedCount++;
                    }
                }
            }
        }

        return updatedCount;
    }

    /**
     * Xử lý sự kiện Pull Request (Opened & Merged -> SUBMITTED để chờ duyệt)
     */
    private int handlePullRequestEvent(JsonNode rootNode, String repoFullName) {
        String action = rootNode.has("action") ? rootNode.get("action").asText() : "";
        JsonNode prNode = rootNode.get("pull_request");
        if (prNode == null) {
            return 0;
        }

        String title = prNode.has("title") ? prNode.get("title").asText() : "";
        String body = prNode.has("body") && !prNode.get("body").isNull() ? prNode.get("body").asText() : "";
        String prUrl = prNode.has("html_url") ? prNode.get("html_url").asText() : "";
        boolean isMerged = prNode.has("merged") && prNode.get("merged").asBoolean();

        String combinedText = title + " \n " + body;
        int updatedCount = 0;

        if ("closed".equalsIgnoreCase(action) && isMerged) {
            // PR đã được MERGE vào nhánh chính -> Chuyển sang SUBMITTED kèm link PR để quản lý duyệt
            log.info("Phát hiện Pull Request đã MERGED: \"{}\"", title);
            Matcher doneMatcher = DONE_PATTERN.matcher(combinedText);
            Set<Long> processed = new HashSet<>();
            while (doneMatcher.find()) {
                Long taskId = Long.parseLong(doneMatcher.group(1));
                if (processed.add(taskId)) {
                    if (updateTaskToSubmitted(taskId, prUrl, "PR Reviewer")) {
                        updatedCount++;
                    }
                }
            }
        } else if ("opened".equalsIgnoreCase(action) || "reopened".equalsIgnoreCase(action)) {
            // PR mới được TẠO -> Chuyển sang SUBMITTED (Đã nộp bài, chờ duyệt code)
            log.info("Phát hiện Pull Request mới được OPENED: \"{}\"", title);
            Matcher doneMatcher = DONE_PATTERN.matcher(combinedText);
            Set<Long> processed = new HashSet<>();
            while (doneMatcher.find()) {
                Long taskId = Long.parseLong(doneMatcher.group(1));
                if (processed.add(taskId)) {
                    if (updateTaskToSubmitted(taskId, prUrl, "PR Author")) {
                        updatedCount++;
                    }
                }
            }
        }

        return updatedCount;
    }

    /**
     * Cập nhật Task sang trạng thái DONE và phát WebSocket
     */
    private boolean updateTaskToDone(Long taskId, String linkUrl, String actorName, String note) {
        Optional<Task> optTask = taskRepository.findById(taskId);
        if (optTask.isEmpty()) {
            log.warn("Không tìm thấy Task ID {} trong hệ thống", taskId);
            return false;
        }

        Task task = optTask.get();
        task.setStatus(TaskStatus.DONE);
        task.setSubmissionLink(linkUrl);
        task.setSubmittedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);

        Project project = saved.getProject();
        cacheEvictionService.evictProjectAnalytics(project.getId());
        realtimeEventService.publishProjectChanged(project, "TASK_STATUS_UPDATED", null);

        log.info("✅ Đã tự động cập nhật Task #{} ({}) sang DONE qua GitHub!", taskId, task.getTitle());
        return true;
    }

    /**
     * Cập nhật Task sang trạng thái SUBMITTED (khi mở Pull Request)
     */
    private boolean updateTaskToSubmitted(Long taskId, String linkUrl, String actorName) {
        Optional<Task> optTask = taskRepository.findById(taskId);
        if (optTask.isEmpty()) {
            return false;
        }

        Task task = optTask.get();
        if (task.getStatus() == TaskStatus.DONE) {
            return false; // Nếu đã DONE thì giữ nguyên
        }

        task.setStatus(TaskStatus.SUBMITTED);
        task.setSubmissionLink(linkUrl);
        task.setSubmittedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);

        Project project = saved.getProject();
        cacheEvictionService.evictProjectAnalytics(project.getId());
        realtimeEventService.publishProjectChanged(project, "TASK_STATUS_UPDATED", null);

        log.info("🚀 Đã tự động cập nhật Task #{} ({}) sang SUBMITTED (Pull Request opened)!", taskId, task.getTitle());
        return true;
    }

    /**
     * Cập nhật Task từ TODO sang IN_PROGRESS (khi bắt đầu commit code)
     */
    private boolean updateTaskToInProgress(Long taskId, String actorName) {
        Optional<Task> optTask = taskRepository.findById(taskId);
        if (optTask.isEmpty()) {
            return false;
        }

        Task task = optTask.get();
        if (task.getStatus() == TaskStatus.TODO) {
            task.setStatus(TaskStatus.IN_PROGRESS);
            Task saved = taskRepository.save(task);

            Project project = saved.getProject();
            cacheEvictionService.evictProjectAnalytics(project.getId());
            realtimeEventService.publishProjectChanged(project, "TASK_STATUS_UPDATED", null);

            log.info("⚡ Đã tự động cập nhật Task #{} ({}) từ TODO sang IN_PROGRESS!", taskId, task.getTitle());
            return true;
        }
        return false;
    }
}
