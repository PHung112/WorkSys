package worksys.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    // task thuộc project nào
    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // task được giao cho ai (nhiều người)
    @ManyToMany
    @JoinTable(
        name = "task_assignees",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private java.util.Set<User> assignees = new java.util.HashSet<>();

    // Những người đã bấm nhận task
    @ManyToMany
    @JoinTable(
        name = "task_accepted_users",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private java.util.Set<User> acceptedUsers = new java.util.HashSet<>();

    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.TODO;

    // Link hoặc đường dẫn file khi nộp task
    @Column(name = "submission_link", length = 512)
    private String submissionLink;

    // Thời điểm nộp task
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    public Task() {
    }

    // Getter & Setter
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

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public java.util.Set<User> getAssignees() {
        return assignees;
    }

    public void setAssignees(java.util.Set<User> assignees) {
        this.assignees = assignees;
    }

    public java.util.Set<User> getAcceptedUsers() {
        return acceptedUsers;
    }

    public void setAcceptedUsers(java.util.Set<User> acceptedUsers) {
        this.acceptedUsers = acceptedUsers;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public String getSubmissionLink() {
        return submissionLink;
    }

    public void setSubmissionLink(String submissionLink) {
        this.submissionLink = submissionLink;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}
