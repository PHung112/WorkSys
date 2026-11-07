package worksys.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor kiểm tra Header 'X-Idempotency-Key' trên các phương thức thay đổi dữ liệu (POST, PUT, PATCH)
 * Ngăn chặn tạo dữ liệu trùng lặp khi người dùng click liên tục nhiều lần.
 */
@Component
public class IdempotencyInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyInterceptor.class);
    public static final String HEADER_IDEMPOTENCY_KEY = "X-Idempotency-Key";

    private final IdempotencyService idempotencyService;

    public IdempotencyInterceptor(IdempotencyService idempotencyService) {
        this.idempotencyService = idempotencyService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();

        // Chỉ kiểm tra các request làm thay đổi dữ liệu (POST, PUT, PATCH)
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            String key = request.getHeader(HEADER_IDEMPOTENCY_KEY);

            if (key != null && !key.isBlank()) {
                // Khóa trong 30 giây
                boolean acquired = idempotencyService.acquire(key, 30);
                if (!acquired) {
                    log.warn("Phát hiện request trùng lặp với Idempotency Key: {}", key);
                    response.setStatus(HttpServletResponse.SC_CONFLICT); // 409 Conflict
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\": \"Yêu cầu đang được xử lý hoặc đã gửi trùng lặp (Duplicate Request). Vui lòng không nhấn liên tục!\"}");
                    return false;
                }
                // Đính kèm key vào request attribute để xử lý ở afterCompletion
                request.setAttribute("CURRENT_IDEMPOTENCY_KEY", key);
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Object keyObj = request.getAttribute("CURRENT_IDEMPOTENCY_KEY");
        if (keyObj instanceof String key) {
            if (ex != null || response.getStatus() >= 400) {
                // Nếu request gặp lỗi, giải phóng key để người dùng có thể thử lại
                idempotencyService.release(key);
            } else {
                // Đánh dấu hoàn thành, giữ trong 30 giây để chống click đúp muộn
                idempotencyService.markCompleted(key, 30);
            }
        }
    }
}

