package trandinhphihung_project.Task.Management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import trandinhphihung_project.Task.Management.security.JwtUtil;
import trandinhphihung_project.Task.Management.service.NotificationService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    public NotificationController(NotificationService notificationService, JwtUtil jwtUtil) {
        this.notificationService = notificationService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public ResponseEntity<?> getMyNotifications(HttpServletRequest request) {
        Long userId = extractUserId(request);
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(HttpServletRequest request) {
        Long userId = extractUserId(request);
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(HttpServletRequest request) {
        Long userId = extractUserId(request);
        try {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả đã đọc"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, HttpServletRequest request) {
        Long userId = extractUserId(request);
        try {
            notificationService.markAsRead(id, userId);
            return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptInvite(@PathVariable Long id, HttpServletRequest request) {
        Long userId = extractUserId(request);
        try {
            notificationService.acceptInvite(id, userId);
            return ResponseEntity.ok(Map.of("message", "Đã chấp nhận lời mời"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<?> declineInvite(@PathVariable Long id, HttpServletRequest request) {
        Long userId = extractUserId(request);
        try {
            notificationService.declineInvite(id, userId);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối lời mời"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing token");
        }
        String token = authHeader.substring(7);
        return jwtUtil.extractUserId(token);
    }
}
