package worksys.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import worksys.entity.AuditLog;
import worksys.repository.AuditLogRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long actorId, String actorName, String action, String targetType, Long targetId, String targetLabel, String metadata) {
        AuditLog log = new AuditLog(actorId, actorName, action, targetType, targetId, targetLabel, metadata);
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getAllLogs(String action, String targetType, LocalDate from, LocalDate to, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> cb.conjunction();

        if (action != null && !action.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), action));
        }

        if (targetType != null && !targetType.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("targetType"), targetType));
        }

        if (from != null) {
            LocalDateTime fromDateTime = from.atStartOfDay();
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromDateTime));
        }

        if (to != null) {
            LocalDateTime toDateTime = to.atTime(23, 59, 59, 999999999);
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toDateTime));
        }

        return auditLogRepository.findAll(spec, pageable);
    }
}
