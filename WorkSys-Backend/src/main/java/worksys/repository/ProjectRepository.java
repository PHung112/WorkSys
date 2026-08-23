package worksys.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import worksys.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
