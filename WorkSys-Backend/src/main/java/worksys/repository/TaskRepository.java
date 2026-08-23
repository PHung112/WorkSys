package worksys.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import worksys.entity.Task;
import worksys.entity.Project;
import worksys.entity.TaskStatus;
import worksys.entity.User;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject(Project project);

    List<Task> findByAssigneesContaining(User user);

    List<Task> findByDeadlineAndAssigneesIsNotEmptyAndStatusNotIn(
            LocalDate deadline, Collection<TaskStatus> statuses);
}
