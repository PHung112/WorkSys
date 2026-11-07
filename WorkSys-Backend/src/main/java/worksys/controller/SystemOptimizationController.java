package worksys.controller;

import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import worksys.service.CacheEvictionService;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller kiểm tra và quản trị Tối ưu hóa Hệ thống (Redis Caching & Rate Limiting)
 * Phục vụ demo phỏng vấn và kiểm thử tính năng High Throughput & Fault Tolerance.
 */
@RestController
@RequestMapping("/api/system/optimization")
public class SystemOptimizationController {

    private final RedisTemplate<String, Object> redisTemplate;
    private final CacheEvictionService cacheEvictionService;

    public SystemOptimizationController(RedisTemplate<String, Object> redisTemplate,
                                      CacheEvictionService cacheEvictionService) {
        this.redisTemplate = redisTemplate;
        this.cacheEvictionService = cacheEvictionService;
    }

    /**
     * Kiểm tra trạng thái kết nối Redis và thông tin vùng nhớ Cache
     */
    @GetMapping("/cache-status")
    public ResponseEntity<Map<String, Object>> getCacheStatus() {
        Map<String, Object> status = new HashMap<>();
        try {
            RedisConnection connection = redisTemplate.getConnectionFactory().getConnection();
            String ping = connection.ping();
            connection.close();

            status.put("redisConnected", true);
            status.put("mode", "High Throughput In-Memory Caching");
            status.put("ping", ping);
            status.put("cachedRegions", new String[]{"user_projects", "project_details", "project_analytics"});
            status.put("message", "Redis Caching đang hoạt động tối ưu. Độ trễ trung bình ~2ms - 5ms.");
        } catch (Exception e) {
            status.put("redisConnected", false);
            status.put("mode", "Resilient Fallback DB Mode (Graceful Degradation)");
            status.put("message", "Redis hiện chưa được bật trên máy chủ. Nhờ cơ chế CustomCacheErrorHandler, hệ thống tự động giáng cấp truy vấn trực tiếp từ PostgreSQL an toàn 100%.");
            status.put("error", e.getMessage());
        }
        return ResponseEntity.ok(status);
    }

    /**
     * Xóa toàn bộ cache thủ công (Manual Invalidation)
     */
    @PostMapping("/clear-cache")
    public ResponseEntity<Map<String, String>> clearCache() {
        cacheEvictionService.clearAllCaches();
        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Toàn bộ cache nghiệp vụ đã được dọn sạch.");
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint kiểm thử Bucket4j Rate Limiting:
     * Mỗi lần gọi sẽ làm giảm token trong bucket của người dùng / IP.
     * Header trả về sẽ có X-Rate-Limit-Remaining.
     */
    @GetMapping("/rate-limit-test")
    public ResponseEntity<Map<String, Object>> testRateLimit() {
        Map<String, Object> res = new HashMap<>();
        res.put("status", 200);
        res.put("message", "Yêu cầu hợp lệ nằm trong hạn mức Rate Limit (60 req/phút).");
        res.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(res);
    }
}
