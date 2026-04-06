package trandinhphihung_project.Task.Management.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import trandinhphihung_project.Task.Management.entity.Project;
import trandinhphihung_project.Task.Management.repository.ProjectMemberRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class RealtimeEventService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ProjectMemberRepository projectMemberRepository;

    public RealtimeEventService(SimpMessagingTemplate messagingTemplate,
            ProjectMemberRepository projectMemberRepository) {
        this.messagingTemplate = messagingTemplate;
        this.projectMemberRepository = projectMemberRepository;
    }

    public void publishNotificationChanged(Long userId, String reason) {
        Map<String, Object> event = baseEvent("NOTIFICATION_CHANGED");
        event.put("reason", reason);
        messagingTemplate.convertAndSend((String) ("/topic/users/" + userId + "/notifications"), (Object) event);
    }

    public void publishProjectListChanged(Long userId, Long projectId, String reason) {
        Map<String, Object> event = baseEvent("PROJECT_LIST_CHANGED");
        event.put("projectId", projectId);
        event.put("reason", reason);
        messagingTemplate.convertAndSend((String) ("/topic/users/" + userId + "/projects"), (Object) event);
    }

    public void publishProjectChanged(Project project, String eventType, Long actorUserId) {
        if (project == null || project.getId() == null) {
            return;
        }

        Map<String, Object> event = baseEvent(eventType);
        event.put("projectId", project.getId());
        event.put("projectName", project.getName());
        event.put("actorUserId", actorUserId);

        messagingTemplate.convertAndSend((String) ("/topic/projects/" + project.getId()), (Object) event);

        projectMemberRepository.findByProject(project).forEach(pm -> {
            Long memberId = pm.getUser().getId();
            publishProjectListChanged(memberId, project.getId(), eventType);
        });
    }

    private Map<String, Object> baseEvent(String type) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", type);
        event.put("timestamp", LocalDateTime.now().toString());
        return event;
    }
}
