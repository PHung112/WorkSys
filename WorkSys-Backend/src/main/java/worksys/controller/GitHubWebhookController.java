package worksys.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import worksys.service.GitHubWebhookService;

import java.util.Map;

/**
 * Controller tiếp nhận Webhook từ GitHub (Event-Driven Integration):
 * Endpoint: POST /api/webhooks/github
 * - Hỗ trợ các sự kiện: ping, push, pull_request
 * - Tự động đồng bộ trạng thái công việc với GitHub
 */
@RestController
@RequestMapping("/api/webhooks")
public class GitHubWebhookController {

    private static final Logger log = LoggerFactory.getLogger(GitHubWebhookController.class);

    private final GitHubWebhookService gitHubWebhookService;

    public GitHubWebhookController(GitHubWebhookService gitHubWebhookService) {
        this.gitHubWebhookService = gitHubWebhookService;
    }

    /**
     * Endpoint kiểm tra trạng thái hoạt động của Webhook (Health Check)
     */
    @GetMapping("/github")
    public ResponseEntity<?> checkWebhookHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "ONLINE",
                "service", "WorkSys GitHub Webhook Listener",
                "message", "Webhook endpoint đang sẵn sàng nhận sự kiện từ GitHub."
        ));
    }

    /**
     * Điểm tiếp nhận sự kiện từ GitHub Webhook
     */
    @PostMapping("/github")
    public ResponseEntity<?> receiveGithubWebhook(
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "ping") String eventType,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signatureHeader,
            @RequestHeader(value = "X-GitHub-Delivery", required = false) String deliveryId,
            @RequestBody String rawPayload) {

        log.info("🔔 Nhận Webhook request từ GitHub! Event: {}, Delivery ID: {}", eventType, deliveryId);

        Map<String, Object> result = gitHubWebhookService.handleWebhookEvent(eventType, rawPayload, signatureHeader);

        if ("UNAUTHORIZED".equals(result.get("status"))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
        }

        return ResponseEntity.ok(result);
    }
}
