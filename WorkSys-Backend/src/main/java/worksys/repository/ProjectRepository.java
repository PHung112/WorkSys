package worksys.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import worksys.entity.Project;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
    List<Project> findByGithubRepoIgnoreCase(String githubRepo);
}
