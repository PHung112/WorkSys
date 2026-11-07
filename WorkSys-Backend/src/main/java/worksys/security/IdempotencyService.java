package worksys.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Service quản lý tính bất biến của request (Idempotency Key) bằng Redis
 * Chống việc người dùng click đúp, click liên tục nhiều lần gây tạo trùng dữ liệu (Duplicate Submissions).
 */
@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);
    private static final String IDEMPOTENCY_PREFIX = "idempotency:key:";

    private final RedisTemplate<String, Object> redisTemplate;

    public IdempotencyService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Thử chiếm quyền xử lý cho một idempotencyKey (nguyên tử bằng SETNX của Redis)
     * @param key Khóa do Client tạo (UUID)
     * @param timeoutSeconds Thời gian khóa (ví dụ 30 giây)
     * @return true nếu đây là request đầu tiên; false nếu request đã/đang được xử lý (trùng lặp)
     */
    public boolean acquire(String key, long timeoutSeconds) {
        if (key == null || key.isBlank()) return true;

        try {
            String redisKey = IDEMPOTENCY_PREFIX + key.trim();
            // setIfAbsent tương đương lệnh SETNX của Redis
            Boolean isNew = redisTemplate.opsForValue().setIfAbsent(redisKey, "PROCESSING", Duration.ofSeconds(timeoutSeconds));
            return Boolean.TRUE.equals(isNew);
        } catch (Exception e) {
            log.warn("Lỗi kiểm tra Redis Idempotency (bỏ qua để không chặn request): {}", e.getMessage());
            return true; // Fallback: nếu Redis lỗi thì không chặn người dùng
        }
    }

    /**
     * Đánh dấu request đã hoàn thành thành công
     */
    public void markCompleted(String key, long retainSeconds) {
        if (key == null || key.isBlank()) return;
        try {
            String redisKey = IDEMPOTENCY_PREFIX + key.trim();
            redisTemplate.opsForValue().set(redisKey, "COMPLETED", Duration.ofSeconds(retainSeconds));
        } catch (Exception e) {
            log.warn("Không thể cập nhật trạng thái Idempotency key: {}", e.getMessage());
        }
    }

    /**
     * Giải phóng key nếu request xử lý thất bại (để người dùng có thể thử lại ngay)
     */
    public void release(String key) {
        if (key == null || key.isBlank()) return;
        try {
            String redisKey = IDEMPOTENCY_PREFIX + key.trim();
            redisTemplate.delete(redisKey);
        } catch (Exception e) {
            log.warn("Không thể giải phóng Idempotency key: {}", e.getMessage());
        }
    }
}

