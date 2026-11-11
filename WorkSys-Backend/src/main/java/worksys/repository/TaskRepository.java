package worksys.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import worksys.entity.Task;
import worksys.entity.Project;
import worksys.entity.TaskStatus;
import worksys.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    // Lấy tất cả task chưa archive của một project (dùng cho Kanban board)
    List<Task> findByProjectAndArchivedFalse(Project project);

    // Lấy tất cả task của một project (bao gồm cả archive và chưa archive)
    List<Task> findByProject(Project project);

    // Lấy tất cả task đã archive của một project (dùng cho trang kho lưu trữ)
    List<Task> findByProjectAndArchivedTrue(Project project);

    // Khởi tạo version = 0 cho các bản ghi cũ bằng Native SQL để tránh Hibernate chặn cập nhật @Version qua HQL
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "UPDATE tasks SET version = 0 WHERE version IS NULL", nativeQuery = true)
    int initializeNullVersions();

    // Khởi tạo completedAt cho các task DONE cũ nếu còn null
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "UPDATE tasks SET completed_at = COALESCE(submitted_at, created_at) WHERE status = 'DONE' AND completed_at IS NULL", nativeQuery = true)
    int initializeNullCompletedAt();

    // Lấy task DONE cần auto-archive trên toàn hệ thống (dựa theo completedAt, submittedAt, deadline hoặc createdAt)
    @Query("SELECT t FROM Task t WHERE t.status = 'DONE' AND t.archived = false AND (" +
           "(t.completedAt IS NOT NULL AND t.completedAt < :cutoff) OR " +
           "(t.completedAt IS NULL AND t.submittedAt IS NOT NULL AND t.submittedAt < :cutoff) OR " +
           "(t.completedAt IS NULL AND t.submittedAt IS NULL AND t.deadline IS NOT NULL AND t.deadline < :cutoffDate) OR " +
           "(t.completedAt IS NULL AND t.submittedAt IS NULL AND t.deadline IS NULL AND t.createdAt < :cutoff)" +
           ")")
    List<Task> findDoneTasksToArchive(@Param("cutoff") LocalDateTime cutoff, @Param("cutoffDate") LocalDate cutoffDate);

    // Lấy task DONE cần auto-archive cho 1 project cụ thể
    @Query("SELECT t FROM Task t WHERE t.project = :project AND t.status = 'DONE' AND t.archived = false AND (" +
           "(t.completedAt IS NOT NULL AND t.completedAt < :cutoff) OR " +
           "(t.completedAt IS NULL AND t.submittedAt IS NOT NULL AND t.submittedAt < :cutoff) OR " +
           "(t.completedAt IS NULL AND t.submittedAt IS NULL AND t.deadline IS NOT NULL AND t.deadline < :cutoffDate) OR " +
           "(t.completedAt IS NULL AND t.submittedAt IS NULL AND t.deadline IS NULL AND t.createdAt < :cutoff)" +
           ")")
    List<Task> findDoneTasksToArchiveByProject(@Param("project") Project project, @Param("cutoff") LocalDateTime cutoff, @Param("cutoffDate") LocalDate cutoffDate);

    List<Task> findByAssigneesContaining(User user);

    List<Task> findByDeadlineAndAssigneesIsNotEmptyAndStatusNotIn(
            java.time.LocalDate deadline, Collection<TaskStatus> statuses);
}
