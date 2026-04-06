package trandinhphihung_project.Task.Management.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import trandinhphihung_project.Task.Management.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
