package worksys.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Service quản lý danh sách đen Token (Token Blacklist) trên Redis
 * Khi người dùng bấm Logout, token sẽ được lưu vào Redis kèm TTL bằng thời gian sống còn lại.
 */
@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtUtil jwtUtil;

    public TokenBlacklistService(RedisTemplate<String, Object> redisTemplate, JwtUtil jwtUtil) {
        this.redisTemplate = redisTemplate;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Đưa token vào Blacklist trên Redis kèm TTL tương ứng với thời gian hết hạn còn lại
     */
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) return;

        try {
            long remainingMillis = jwtUtil.getRemainingExpirationMillis(token);
            if (remainingMillis > 0) {
                String key = BLACKLIST_PREFIX + token;
                redisTemplate.opsForValue().set(key, "revoked", Duration.ofMillis(remainingMillis));
                log.info("Token đã được đưa vào Redis Blacklist với TTL: {} ms", remainingMillis);
            }
        } catch (Exception e) {
            log.warn("Không thể lưu token vào Redis blacklist: {}", e.getMessage());
        }
    }

    /**
     * Kiểm tra xem token có nằm trong Blacklist hay không
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) return false;

        try {
            String key = BLACKLIST_PREFIX + token;
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.warn("Lỗi kiểm tra Redis blacklist: {}", e.getMessage());
            return false;
        }
    }
}

