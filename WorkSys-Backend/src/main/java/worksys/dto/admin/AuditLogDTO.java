package worksys.dto.admin;

import java.time.LocalDateTime;

public class AuditLogDTO {
    public Long id;
    public Long actorId;
    public String actorName;
    public String action;
    public String targetType;
    public Long targetId;
    public String targetLabel;
    public String metadata;
    public LocalDateTime createdAt;
}
