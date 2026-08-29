package worksys.dto.admin;

import java.time.LocalDateTime;

public class AdminProjectDTO {
    public Long id;
    public String name;
    public String description;
    public String adminName; // CreatedBy username
    public long memberCount;
    public long totalTasks;
    public long completedTasks;
    public long overdueTasks;
    public double progress;
    public LocalDateTime createdAt;
    public boolean archived; // assuming there might be an archived field, although currently not explicit in Project entity. I will skip archived if not present. Wait, Project entity doesn't have `archived`. Let's add archived field to Project.
}
