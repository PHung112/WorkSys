package worksys.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import worksys.entity.Project;
import worksys.repository.ProjectMemberRepository;

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

    public void publishProjectListChanged(Long userId, Long projectId, String reason, Long actorUserId) {
        Map<String, Object> event = baseEvent("PROJECT_LIST_CHANGED");
        event.put("projectId", projectId);
        event.put("reason", reason);
        event.put("actorUserId", actorUserId);
        messagingTemplate.convertAndSend((String) ("/topic/users/" + userId + "/projects"), (Object) event);
    }

    public void publishProjectListChanged(Long userId, Long projectId, String reason) {
        publishProjectListChanged(userId, projectId, reason, null);
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

        // Chỉ gửi PROJECT_LIST_CHANGED tới user khi có thay đổi liên quan tới danh sách project hoặc vai trò/thành viên
        if ("PROJECT_CREATED".equals(eventType) || "PROJECT_UPDATED".equals(eventType)
                || "PROJECT_DELETED".equals(eventType) || "MEMBER_JOINED".equals(eventType)
                || "MEMBER_ROLE_UPDATED".equals(eventType) || "MEMBER_REMOVED".equals(eventType)) {
            projectMemberRepository.findByProject(project).forEach(pm -> {
                Long memberId = pm.getUser().getId();
                publishProjectListChanged(memberId, project.getId(), eventType, actorUserId);
            });
        }
    }

    private Map<String, Object> baseEvent(String type) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", type);
        event.put("timestamp", LocalDateTime.now().toString());
        return event;
    }
}
