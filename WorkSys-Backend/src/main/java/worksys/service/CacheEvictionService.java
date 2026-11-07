package worksys.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.Collection;

/**
 * Service quản lý việc giải phóng và hủy bỏ cache (Cache Eviction) trong mô hình Cache-Aside
 * Đảm bảo dữ liệu trong Redis luôn đồng bộ với Database khi có thao tác ghi / cập nhật / xóa (Write-Through / Invalidation).
 */
@Service
public class CacheEvictionService {

    private static final Logger log = LoggerFactory.getLogger(CacheEvictionService.class);
    private final CacheManager cacheManager;

    public CacheEvictionService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Hủy cache danh sách dự án của 1 người dùng cụ thể
     */
    public void evictUserProjects(Long userId) {
        evict("user_projects", userId);
    }

    /**
     * Hủy cache danh sách dự án của nhiều người dùng (ví dụ khi xóa dự án hoặc thay đổi thành viên)
     */
    public void evictUserProjects(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return;
        for (Long userId : userIds) {
            evictUserProjects(userId);
        }
    }

    /**
     * Hủy cache thông tin chi tiết của 1 dự án
     */
    public void evictProjectDetails(Long projectId) {
        evict("project_details", projectId);
    }

    /**
     * Hủy cache báo cáo thống kê phân tích của 1 dự án
     */
    public void evictProjectAnalytics(Long projectId) {
        evict("project_analytics", projectId);
    }

    /**
     * Hủy toàn bộ cache liên quan đến dự án (chi tiết + analytics)
     */
    public void evictProjectAll(Long projectId) {
        evictProjectDetails(projectId);
        evictProjectAnalytics(projectId);
    }

    /**
     * Xóa sạch toàn bộ các vùng cache trong Redis
     */
    public void clearAllCaches() {
        for (String cacheName : cacheManager.getCacheNames()) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                try {
                    cache.clear();
                    log.info("Đã dọn sạch cache: {}", cacheName);
                } catch (Exception e) {
                    log.warn("Không thể dọn sạch cache {}: {}", cacheName, e.getMessage());
                }
            }
        }
    }

    private void evict(String cacheName, Object key) {
        if (key == null) return;
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.evict(key);
                log.debug("Đã evict cache [{}] cho key [{}]", cacheName, key);
            }
        } catch (Exception e) {
            log.warn("Lỗi khi evict cache [{}] với key [{}]: {}", cacheName, key, e.getMessage());
        }
    }
}
