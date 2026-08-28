package worksys.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import worksys.entity.Task;
import worksys.entity.Project;
import worksys.entity.TaskStatus;
import worksys.entity.User;

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

    // Lấy task đã DONE, chưa archive, và đã hoàn thành trước một thời điểm nhất định (dùng cho scheduler)
    @Query("SELECT t FROM Task t WHERE t.status = 'DONE' AND t.archived = false AND t.submittedAt IS NOT NULL AND t.submittedAt < :cutoff")
    List<Task> findDoneTasksToArchive(LocalDateTime cutoff);

    // Lấy task DONE không có submittedAt (ADMIN mark done) trước cutoff dựa theo deadline
    @Query("SELECT t FROM Task t WHERE t.status = 'DONE' AND t.archived = false AND t.submittedAt IS NULL AND t.deadline IS NOT NULL AND CAST(t.deadline AS timestamp) < :cutoff")
    List<Task> findDoneTasksWithoutSubmitToArchive(LocalDateTime cutoff);

    List<Task> findByAssigneesContaining(User user);

    List<Task> findByDeadlineAndAssigneesIsNotEmptyAndStatusNotIn(
            java.time.LocalDate deadline, Collection<TaskStatus> statuses);
}
