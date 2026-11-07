package worksys.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

/**
 * Resilient Cache Error Handler
 * Đảm bảo hệ thống KHÔNG BỊ CRASH khi Redis gặp sự cố (mất kết nối, timeout).
 * Tự động giáng cấp (graceful degradation) về truy vấn cơ sở dữ liệu PostgreSQL trực tiếp.
 */
public class CustomCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(CustomCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        log.warn("⚠️ [Redis Resiliency] Không thể lấy cache [{}] với key [{}]. Tự động truy vấn trực tiếp từ Database. Lỗi: {}",
                cache != null ? cache.getName() : "unknown", key, exception.getMessage());
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
        log.warn("⚠️ [Redis Resiliency] Không thể ghi cache [{}] với key [{}]. Bỏ qua lưu cache. Lỗi: {}",
                cache != null ? cache.getName() : "unknown", key, exception.getMessage());
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        log.warn("⚠️ [Redis Resiliency] Không thể xóa cache [{}] với key [{}]. Lỗi: {}",
                cache != null ? cache.getName() : "unknown", key, exception.getMessage());
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        log.warn("⚠️ [Redis Resiliency] Không thể dọn dẹp cache [{}]. Lỗi: {}",
                cache != null ? cache.getName() : "unknown", exception.getMessage());
    }
}
