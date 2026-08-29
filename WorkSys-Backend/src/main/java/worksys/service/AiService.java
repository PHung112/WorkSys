package worksys.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import worksys.entity.Project;
import worksys.entity.Task;
import worksys.repository.ProjectRepository;
import worksys.repository.TaskRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiService {

    @Value("${google.gemini.api-key}")
    private String apiKey;

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final RestTemplate restTemplate;

    public AiService(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.restTemplate = new RestTemplate();
    }

    public String analyzeProjectTasks(Long projectId, String prompt) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Task> tasks = taskRepository.findByProject(project);

        String taskData = tasks.stream().map(t -> {
            String assignees = t.getAssignees().stream().map(u -> u.getUsername()).collect(Collectors.joining(", "));
            String deadline = t.getDeadline() != null ? t.getDeadline().toString() : "Không có";
            return String.format("- %s: Trạng thái: %s, Hạn chót: %s, Người thực hiện: [%s]",
                    t.getTitle(), t.getStatus(), deadline, assignees);
        }).collect(Collectors.joining("\n"));

        String systemPrompt = String.format(
                "Bạn là trợ lý ảo phân tích dự án thông minh. Hôm nay là ngày %s. Dự án: %s.\n" +
                        "Danh sách Task hiện tại:\n%s\n\n" +
                        "Dựa vào thông tin trên, hãy trả lời câu hỏi/yêu cầu sau của Admin: %s\n\n" +
                        "QUY TẮC FORMAT BẮT BUỘC khi liệt kê task:\n" +
                        "- KHÔNG hiển thị ID task (không dùng 'ID: xx' hay 'Task #xx').\n" +
                        "- Thành viên phải liệt kê trên MỘT DÒNG DUY NHẤT, cách nhau bằng dấu phẩy. Ví dụ: 'Thành viên: an, binh, cuong'.\n" +
                        "- KHÔNG liệt kê trạng thái riêng lẻ cho từng thành viên.\n" +
                        "- Trả lời ngắn gọn, súc tích bằng tiếng Việt, dùng Markdown (in đậm, danh sách).",
                LocalDate.now().toString(), project.getName(), taskData, prompt
        );

        String url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = Map.of("text", systemPrompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            Map response = restTemplate.postForObject(url, entity, Map.class);
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> responseContent = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) responseContent.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Xin lỗi, đã xảy ra lỗi khi gọi AI API: " + e.getMessage();
        }

        return "Không nhận được phản hồi từ AI.";
    }
}
