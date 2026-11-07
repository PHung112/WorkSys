package worksys.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service quản lý giới hạn tần suất gọi API (Rate Limiting) sử dụng Bucket4j (Token Bucket Algorithm)
 * - General APIs: Tối đa 60 requests/phút trên mỗi Client/IP/User
 * - Auth APIs: Tối đa 10 requests/phút chống Brute-force mật khẩu và spam đăng ký
 */
@Service
public class RateLimitingService {

    // Cache in-memory lưu trữ token bucket theo từng client key
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    public Bucket resolveGeneralBucket(String clientKey) {
        return generalBuckets.computeIfAbsent(clientKey, k -> createGeneralBucket());
    }

    public Bucket resolveAuthBucket(String clientKey) {
        return authBuckets.computeIfAbsent(clientKey, k -> createAuthBucket());
    }

    private Bucket createGeneralBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(60)
                .refillGreedy(60, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createAuthBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(10)
                .refillGreedy(10, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
