package worksys.dto;

import java.time.LocalDate;
import java.util.List;

public class ProjectAnalyticsDTO {

    private KpiDTO kpi;
    private List<StatusBreakdownDTO> statusBreakdown;
    private List<MemberWorkloadDTO> memberWorkloads;
    private List<CompletionTrendDTO> completionTrend;
    private List<UpcomingDeadlineDTO> upcomingDeadlines;

    public ProjectAnalyticsDTO() {
    }

    public ProjectAnalyticsDTO(KpiDTO kpi, List<StatusBreakdownDTO> statusBreakdown,
                               List<MemberWorkloadDTO> memberWorkloads, List<CompletionTrendDTO> completionTrend,
                               List<UpcomingDeadlineDTO> upcomingDeadlines) {
        this.kpi = kpi;
        this.statusBreakdown = statusBreakdown;
        this.memberWorkloads = memberWorkloads;
        this.completionTrend = completionTrend;
        this.upcomingDeadlines = upcomingDeadlines;
    }

    public KpiDTO getKpi() {
        return kpi;
    }

    public void setKpi(KpiDTO kpi) {
        this.kpi = kpi;
    }

    public List<StatusBreakdownDTO> getStatusBreakdown() {
        return statusBreakdown;
    }

    public void setStatusBreakdown(List<StatusBreakdownDTO> statusBreakdown) {
        this.statusBreakdown = statusBreakdown;
    }

    public List<MemberWorkloadDTO> getMemberWorkloads() {
        return memberWorkloads;
    }

    public void setMemberWorkloads(List<MemberWorkloadDTO> memberWorkloads) {
        this.memberWorkloads = memberWorkloads;
    }

    public List<CompletionTrendDTO> getCompletionTrend() {
        return completionTrend;
    }

    public void setCompletionTrend(List<CompletionTrendDTO> completionTrend) {
        this.completionTrend = completionTrend;
    }

    public List<UpcomingDeadlineDTO> getUpcomingDeadlines() {
        return upcomingDeadlines;
    }

    public void setUpcomingDeadlines(List<UpcomingDeadlineDTO> upcomingDeadlines) {
        this.upcomingDeadlines = upcomingDeadlines;
    }

    // --- Inner DTOs ---

    public static class KpiDTO {
        private long totalTasks;
        private long completedTasks;
        private long inProgressTasks;
        private long todoTasks;
        private long submittedTasks;
        private long overdueTasks;
        private double completionRate;
        private double onTimeRate;
        private double avgCompletionDays;

        public KpiDTO() {}

        public KpiDTO(long totalTasks, long completedTasks, long inProgressTasks, long todoTasks,
                      long submittedTasks, long overdueTasks, double completionRate,
                      double onTimeRate, double avgCompletionDays) {
            this.totalTasks = totalTasks;
            this.completedTasks = completedTasks;
            this.inProgressTasks = inProgressTasks;
            this.todoTasks = todoTasks;
            this.submittedTasks = submittedTasks;
            this.overdueTasks = overdueTasks;
            this.completionRate = completionRate;
            this.onTimeRate = onTimeRate;
            this.avgCompletionDays = avgCompletionDays;
        }

        public long getTotalTasks() { return totalTasks; }
        public void setTotalTasks(long totalTasks) { this.totalTasks = totalTasks; }

        public long getCompletedTasks() { return completedTasks; }
        public void setCompletedTasks(long completedTasks) { this.completedTasks = completedTasks; }

        public long getInProgressTasks() { return inProgressTasks; }
        public void setInProgressTasks(long inProgressTasks) { this.inProgressTasks = inProgressTasks; }

        public long getTodoTasks() { return todoTasks; }
        public void setTodoTasks(long todoTasks) { this.todoTasks = todoTasks; }

        public long getSubmittedTasks() { return submittedTasks; }
        public void setSubmittedTasks(long submittedTasks) { this.submittedTasks = submittedTasks; }

        public long getOverdueTasks() { return overdueTasks; }
        public void setOverdueTasks(long overdueTasks) { this.overdueTasks = overdueTasks; }

        public double getCompletionRate() { return completionRate; }
        public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }

        public double getOnTimeRate() { return onTimeRate; }
        public void setOnTimeRate(double onTimeRate) { this.onTimeRate = onTimeRate; }

        public double getAvgCompletionDays() { return avgCompletionDays; }
        public void setAvgCompletionDays(double avgCompletionDays) { this.avgCompletionDays = avgCompletionDays; }
    }

    public static class StatusBreakdownDTO {
        private String name;
        private String code;
        private long count;
        private String color;

        public StatusBreakdownDTO() {}

        public StatusBreakdownDTO(String name, String code, long count, String color) {
            this.name = name;
            this.code = code;
            this.count = count;
            this.color = color;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public static class MemberWorkloadDTO {
        private Long userId;
        private String username;
        private String email;
        private String avatarUrl;
        private String role;
        private long totalAssigned;
        private long completedCount;
        private long inProgressCount;
        private long overdueCount;
        private double onTimeRate;

        public MemberWorkloadDTO() {}

        public MemberWorkloadDTO(Long userId, String username, String email, String avatarUrl,
                                 String role, long totalAssigned, long completedCount,
                                 long inProgressCount, long overdueCount, double onTimeRate) {
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.avatarUrl = avatarUrl;
            this.role = role;
            this.totalAssigned = totalAssigned;
            this.completedCount = completedCount;
            this.inProgressCount = inProgressCount;
            this.overdueCount = overdueCount;
            this.onTimeRate = onTimeRate;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public long getTotalAssigned() { return totalAssigned; }
        public void setTotalAssigned(long totalAssigned) { this.totalAssigned = totalAssigned; }

        public long getCompletedCount() { return completedCount; }
        public void setCompletedCount(long completedCount) { this.completedCount = completedCount; }

        public long getInProgressCount() { return inProgressCount; }
        public void setInProgressCount(long inProgressCount) { this.inProgressCount = inProgressCount; }

        public long getOverdueCount() { return overdueCount; }
        public void setOverdueCount(long overdueCount) { this.overdueCount = overdueCount; }

        public double getOnTimeRate() { return onTimeRate; }
        public void setOnTimeRate(double onTimeRate) { this.onTimeRate = onTimeRate; }
    }

    public static class CompletionTrendDTO {
        private String date;
        private long completed;
        private long created;

        public CompletionTrendDTO() {}

        public CompletionTrendDTO(String date, long completed, long created) {
            this.date = date;
            this.completed = completed;
            this.created = created;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public long getCompleted() { return completed; }
        public void setCompleted(long completed) { this.completed = completed; }

        public long getCreated() { return created; }
        public void setCreated(long created) { this.created = created; }
    }

    public static class UpcomingDeadlineDTO {
        private Long id;
        private String title;
        private LocalDate deadline;
        private String status;
        private boolean isOverdue;
        private List<String> assigneeNames;

        public UpcomingDeadlineDTO() {}

        public UpcomingDeadlineDTO(Long id, String title, LocalDate deadline, String status,
                                   boolean isOverdue, List<String> assigneeNames) {
            this.id = id;
            this.title = title;
            this.deadline = deadline;
            this.status = status;
            this.isOverdue = isOverdue;
            this.assigneeNames = assigneeNames;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public LocalDate getDeadline() { return deadline; }
        public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public boolean isOverdue() { return isOverdue; }
        public void setOverdue(boolean overdue) { isOverdue = overdue; }

        public List<String> getAssigneeNames() { return assigneeNames; }
        public void setAssigneeNames(List<String> assigneeNames) { this.assigneeNames = assigneeNames; }
    }
}
