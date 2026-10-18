package worksys.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter giới hạn tần suất gọi API (Rate Limiting) theo chuẩn bảo mật:
 * - Trả về mã lỗi HTTP 429 (Too Many Requests) khi vượt ngưỡng
 * - Đính kèm HTTP Headers: X-Rate-Limit-Remaining, X-Rate-Limit-Retry-After-Seconds
 * - Phân loại Rate Limit:
 *   + Endpoint xác thực (/api/auth/**): 10 requests / phút
 *   + Endpoint nghiệp vụ (/api/**): 60 requests / phút
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;
    private final JwtUtil jwtUtil;

    public RateLimitingFilter(RateLimitingService rateLimitingService, JwtUtil jwtUtil) {
        this.rateLimitingService = rateLimitingService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Bỏ qua CORS preflight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        // 2. Chỉ kiểm soát các API bắt đầu bằng /api và không chặn websocket (/ws)
        if (!path.startsWith("/api") || path.startsWith("/ws")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Xác định Client Identifier (Ưu tiên User ID từ JWT, nếu chưa đăng nhập dùng Client IP)
        String clientKey = extractClientIdentifier(request);

        // 4. Chọn bucket phù hợp với loại endpoint
        boolean isAuthEndpoint = path.startsWith("/api/auth");
        Bucket bucket = isAuthEndpoint
                ? rateLimitingService.resolveAuthBucket(clientKey)
                : rateLimitingService.resolveGeneralBucket(clientKey);

        // 5. Thử tiêu thụ 1 token từ bucket
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            // Cho phép request tiếp tục và đính kèm số token còn lại vào Header
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            // Quá tải request -> Trả về HTTP 429
            long retryAfterSeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000L);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("X-Rate-Limit-Remaining", "0");
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(retryAfterSeconds));
            response.setContentType("application/json;charset=UTF-8");

            String errorMessage = String.format(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Hệ thống phát hiện tần suất yêu cầu quá cao. Vui lòng thử lại sau %d giây.\",\"retryAfterSeconds\":%d}",
                    retryAfterSeconds, retryAfterSeconds
            );

            response.getWriter().write(errorMessage);
        }
    }

    private String extractClientIdentifier(HttpServletRequest request) {
        // Kiểm tra token Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Long userId = jwtUtil.extractUserId(token);
                if (userId != null) {
                    return "user:" + userId;
                }
            } catch (Exception ignored) {
                // Token lỗi hoặc hết hạn -> fallback về IP
            }
        }

        // Lấy IP của Client (xử lý proxy như Nginx / Cloudflare qua X-Forwarded-For)
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else {
            ip = ip.split(",")[0].trim();
        }

        return "ip:" + ip;
    }
}
