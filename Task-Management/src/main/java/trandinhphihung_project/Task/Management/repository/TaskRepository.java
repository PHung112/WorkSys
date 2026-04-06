package trandinhphihung_project.Task.Management.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import trandinhphihung_project.Task.Management.entity.Task;
import trandinhphihung_project.Task.Management.entity.Project;
import trandinhphihung_project.Task.Management.entity.TaskStatus;
import trandinhphihung_project.Task.Management.entity.User;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject(Project project);

    List<Task> findByAssignedTo(User user);

    List<Task> findByDeadlineAndAssignedToIsNotNullAndStatusNotIn(
            LocalDate deadline, Collection<TaskStatus> statuses);
}