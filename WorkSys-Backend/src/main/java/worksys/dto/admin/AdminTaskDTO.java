package worksys.dto.admin;

import worksys.entity.TaskStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class AdminTaskDTO {
    public Long id;
    public String title;
    public Long projectId;
    public String projectName;
    public TaskStatus status;
    public LocalDate deadline;
    public LocalDateTime createdAt; // Actually Task doesn't have createdAt, but it has submittedAt. Wait, let's look at Task.java.
    public boolean archived;
    public List<AssigneeDTO> assignees;

    public static class AssigneeDTO {
        public Long id;
        public String username;
        public String avatarUrl;
    }
}
