package worksys.dto;

public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private String deadline;
    private String status;

    // Thông tin project
    private Long projectId;
    private String projectName;

    // Thông tin assigned user (multiple)
    private java.util.List<AssigneeDTO> assignees;
    private java.util.List<Long> acceptedUserIds;

    // Link hoặc file tài liệu đính kèm mô tả task
    private String attachmentUrl;

    // Link hoặc file nộp task
    private String submissionLink;
    private String submittedAt; // ISO datetime khi nộp
    private boolean late; // nộp muộn hơn deadline

    // Archive
    private boolean archived;
    private String archivedAt;
    
    private String createdAt;

    public TaskDTO() {
    }

    public TaskDTO(Long id, String title, String description, String deadline, String status,
            Long projectId, String projectName,
            java.util.List<AssigneeDTO> assignees, java.util.List<Long> acceptedUserIds,
            String submissionLink) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.status = status;
        this.projectId = projectId;
        this.projectName = projectName;
        this.assignees = assignees;
        this.acceptedUserIds = acceptedUserIds;
        this.submissionLink = submissionLink;
    }

    public static class AssigneeDTO {
        private Long id;
        private String username;
        private String email;
        private String avatarUrl;

        public AssigneeDTO() {}
        public AssigneeDTO(Long id, String username, String email) {
            this.id = id;
            this.username = username;
            this.email = email;
        }
        public AssigneeDTO(Long id, String username, String email, String avatarUrl) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.avatarUrl = avatarUrl;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public java.util.List<AssigneeDTO> getAssignees() {
        return assignees;
    }

    public void setAssignees(java.util.List<AssigneeDTO> assignees) {
        this.assignees = assignees;
    }

    public java.util.List<Long> getAcceptedUserIds() {
        return acceptedUserIds;
    }

    public void setAcceptedUserIds(java.util.List<Long> acceptedUserIds) {
        this.acceptedUserIds = acceptedUserIds;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getSubmissionLink() {
        return submissionLink;
    }

    public void setSubmissionLink(String submissionLink) {
        this.submissionLink = submissionLink;
    }

    public String getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(String submittedAt) {
        this.submittedAt = submittedAt;
    }

    public boolean isLate() {
        return late;
    }

    public void setLate(boolean late) {
        this.late = late;
    }
    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public String getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(String archivedAt) {
        this.archivedAt = archivedAt;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
