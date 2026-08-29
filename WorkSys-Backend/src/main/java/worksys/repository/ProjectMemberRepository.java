package worksys.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import worksys.entity.ProjectMember;
import worksys.entity.Project;
import worksys.entity.User;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProject(Project project);

    Optional<ProjectMember> findByProjectAndUser(Project project, User user);

    Optional<ProjectMember> findByProjectAndUser_Id(Project project, Long userId);

    List<ProjectMember> findByUser(User user);
}
