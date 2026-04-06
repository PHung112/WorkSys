package trandinhphihung_project.Task.Management.dto;

public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private String deadline;
    private String status;

    // Thông tin project
    private Long projectId;
    private String projectName;

    // Thông tin assigned user
    private Long assignedToId;
    private String assignedToUsername;
    private String assignedToEmail;

    // Link hoặc file nộp task
    private String submissionLink;
    private String submittedAt; // ISO datetime khi nộp
    private boolean late; // nộp muộn hơn deadline

    public TaskDTO() {
    }

    public TaskDTO(Long id, String title, String description, String deadline, String status,
            Long projectId, String projectName,
            Long assignedToId, String assignedToUsername, String assignedToEmail,
            String submissionLink) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.status = status;
        this.projectId = projectId;
        this.projectName = projectName;
        this.assignedToId = assignedToId;
        this.assignedToUsername = assignedToUsername;
        this.assignedToEmail = assignedToEmail;
        this.submissionLink = submissionLink;
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

    public Long getAssignedToId() {
        return assignedToId;
    }

    public void setAssignedToId(Long assignedToId) {
        this.assignedToId = assignedToId;
    }

    public String getAssignedToUsername() {
        return assignedToUsername;
    }

    public void setAssignedToUsername(String assignedToUsername) {
        this.assignedToUsername = assignedToUsername;
    }

    public String getAssignedToEmail() {
        return assignedToEmail;
    }

    public void setAssignedToEmail(String assignedToEmail) {
        this.assignedToEmail = assignedToEmail;
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
}
