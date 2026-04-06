package trandinhphihung_project.Task.Management.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import trandinhphihung_project.Task.Management.entity.ProjectMember;
import trandinhphihung_project.Task.Management.entity.Project;
import trandinhphihung_project.Task.Management.entity.User;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProject(Project project);

    Optional<ProjectMember> findByProjectAndUser(Project project, User user);

    List<ProjectMember> findByUser(User user);
}
