package worksys.dto.admin;

import worksys.entity.SystemRole;
import worksys.entity.UserStatus;
import java.time.LocalDateTime;

public class AdminUserDTO {
    public Long id;
    public String username;
    public String email;
    public String avatarUrl;
    public SystemRole systemRole;
    public UserStatus status;
    public LocalDateTime createdAt;
    public long projectCount;
    public long taskCount;
}
