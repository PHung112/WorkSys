package worksys.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import worksys.dto.AiGeneratedSubTaskDTO;
import worksys.dto.AiTaskDecomposeRequestDTO;
import worksys.entity.Project;
import worksys.entity.ProjectMember;
import worksys.entity.Task;
import worksys.repository.ProjectMemberRepository;
import worksys.repository.ProjectRepository;
import worksys.repository.TaskRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service xử lý toàn bộ các tác vụ liên quan đến Trí tuệ Nhân tạo (Google Gemini 2.5 Flash)
 * Bao gồm:
 * 1. Phân tích hiện trạng dự án & trả lời câu hỏi của Admin (Q&A)
 * 2. Tự động phân rã mục tiêu lớn thành các sub-tasks chi tiết (WBS - Task Decomposition)
 */
@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    @Value("${google.gemini.api-key}")
    private String apiKey;

    @Value("${google.gemini.model:gemini-2.5-flash}")
    private String model;

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final RestTemplate restTemplate;

    public AiService(TaskRepository taskRepository,
                     ProjectRepository projectRepository,
                     ProjectMemberRepository projectMemberRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Chức năng 1: Hỏi đáp & Phân tích hiện trạng các task trong dự án (Chatbot hỗ trợ Admin)
     */
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

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

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
            log.error("Lỗi khi gọi Gemini API trong analyzeProjectTasks: {}", e.getMessage(), e);
            return "Xin lỗi, đã xảy ra lỗi khi gọi AI API: " + e.getMessage();
        }

        return "Không nhận được phản hồi từ AI.";
    }

    /**
     * Chức năng 2: Phân rã mục tiêu lớn thành các sub-tasks kỹ thuật cụ thể (WBS - Task Decomposition)
     * - Đầu vào: Thông tin dự án + Mục tiêu tính năng từ người dùng
     * - AI: Trả về Strict JSON Schema gồm 3-6 task
     * - Đầu ra: Danh sách AiGeneratedSubTaskDTO sẵn sàng để Frontend preview & chỉnh sửa
     */
    public List<AiGeneratedSubTaskDTO> decomposeFeature(Long projectId, AiTaskDecomposeRequestDTO requestDTO) {
        // 1. Kiểm tra dự án hợp lệ
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Dự án không tồn tại với ID: " + projectId));

        // 2. Lấy danh sách thành viên hiện có trong dự án để đưa vào ngữ cảnh cho AI
        List<ProjectMember> members = projectMemberRepository.findByProject(project);
        String memberContext = members.stream()
                .map(m -> String.format("- ID: %d | Username: %s | Role: %s",
                        m.getUser().getId(), m.getUser().getUsername(), m.getRole().name()))
                .collect(Collectors.joining("\n"));

        if (memberContext.isBlank()) {
            memberContext = "(Dự án hiện chưa có thành viên nào khác)";
        }

        LocalDate today = LocalDate.now();
        String targetDeadline = (requestDTO.getTargetDeadline() != null && !requestDTO.getTargetDeadline().isBlank())
                ? requestDTO.getTargetDeadline().trim()
                : today.plusDays(14).toString();

        // 3. Xây dựng Prompt kỹ thuật (Prompt Engineering + Few-Shot)
        String prompt = String.format(
                """
                Bạn là một Tech Lead / Software Architect giàu kinh nghiệm thực chiến.
                Nhiệm vụ của bạn: Hãy phân rã mục tiêu tính năng phần mềm lớn dưới đây thành từ 3 đến 6 nhiệm vụ con (Sub-tasks) cụ thể, bám sát quy trình phát triển phần mềm chuẩn:
                Bước 1: Thiết kế CSDL & Models -> Bước 2: Viết REST API Backend & Nghiệp vụ -> Bước 3: Dựng Giao diện UI/UX Frontend -> Bước 4: Tích hợp, Kiểm thử & Xử lý lỗi.

                THÔNG TIN DỰ ÁN:
                - Tên dự án: %s
                - Ngày hôm nay: %s
                - Hạn chót mục tiêu hoàn thành: %s
                - Danh sách thành viên trong team:
                %s

                MỤC TIÊU / TÍNH NĂNG CẦN PHÂN RÃ:
                %s

                YÊU CẦU BỔ SUNG (NẾU CÓ):
                %s

                QUY TẮC PHẢN HỒI BẮT BUỘC (TUÂN THỦ 100%%):
                1. Chỉ trả về DUY NHẤT một chuỗi JSON Array thuần túy. TUYỆT ĐỐI KHÔNG thêm bất kỳ câu chào, giải thích, markdown nào ngoài JSON.
                2. Mỗi phần tử trong mảng JSON phải đúng theo cấu trúc sau:
                [
                  {
                    "title": "Tiêu đề nhiệm vụ con ngắn gọn, súc tích (tiếng Việt)",
                    "description": "Mô tả chi tiết các bước kỹ thuật cần làm, công nghệ sử dụng và tiêu chí nghiệm thu",
                    "priority": "HIGH", // chỉ chọn 1 trong 3 giá trị: HIGH, MEDIUM, LOW
                    "estimatedDays": 2, // số nguyên ngày ước tính hoàn thành (từ 1 đến 7)
                    "suggestedDeadline": "YYYY-MM-DD", // ngày hạn chót gợi ý (từ hôm nay đến trước hoặc bằng %s)
                    "suggestedAssigneeId": 1, // ID thành viên phù hợp từ danh sách trên (hoặc null nếu không xác định)
                    "suggestedAssigneeName": "username" // Tên thành viên tương ứng (hoặc null)
                  }
                ]
                """,
                project.getName(),
                today,
                targetDeadline,
                memberContext,
                requestDTO.getFeatureGoal(),
                requestDTO.getAdditionalRequirements() != null ? requestDTO.getAdditionalRequirements() : "Không có yêu cầu thêm",
                targetDeadline
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Cấu hình request gửi đến Gemini với chế độ ép định dạng JSON (responseMimeType: application/json)
        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> generationConfig = Map.of(
                "responseMimeType", "application/json",
                "temperature", 0.3
        );
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(content),
                "generationConfig", generationConfig
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            Map response = restTemplate.postForObject(url, entity, Map.class);
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> responseContent = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) responseContent.get("parts");
                    if (!parts.isEmpty()) {
                        String rawJson = (String) parts.get(0).get("text");
                        return parseAndValidateTasks(rawJson, today);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API phân rã task: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể phân rã task bằng AI: " + e.getMessage());
        }

        throw new RuntimeException("AI không trả về kết quả phân rã nào.");
    }

    /**
     * Hàm phụ trợ làm sạch chuỗi JSON và chuyển đổi (parse) thành List DTO an toàn
     */
    private List<AiGeneratedSubTaskDTO> parseAndValidateTasks(String rawJson, LocalDate today) {
        if (rawJson == null || rawJson.isBlank()) {
            throw new RuntimeException("Dữ liệu JSON từ AI rỗng");
        }

        // Bóc tách markdown code block nếu Gemini có lỡ bọc (ví dụ: ```json ... ```)
        String cleaned = rawJson.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();

        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> taskMapList = mapper.readValue(
                    cleaned,
                    new TypeReference<List<Map<String, Object>>>() {}
            );

            List<AiGeneratedSubTaskDTO> result = new ArrayList<>();
            for (Map<String, Object> map : taskMapList) {
                String title = map.get("title") != null ? map.get("title").toString() : "Nhiệm vụ mới";
                String description = map.get("description") != null ? map.get("description").toString() : "";
                String priority = map.get("priority") != null ? map.get("priority").toString().toUpperCase() : "MEDIUM";
                if (!priority.equals("HIGH") && !priority.equals("MEDIUM") && !priority.equals("LOW")) {
                    priority = "MEDIUM";
                }

                Integer estimatedDays = 2;
                if (map.get("estimatedDays") instanceof Number num) {
                    estimatedDays = Math.max(1, Math.min(14, num.intValue()));
                }

                String suggestedDeadline = map.get("suggestedDeadline") != null
                        ? map.get("suggestedDeadline").toString()
                        : today.plusDays(estimatedDays).toString();

                Long suggestedAssigneeId = null;
                if (map.get("suggestedAssigneeId") instanceof Number num) {
                    suggestedAssigneeId = num.longValue();
                }

                String suggestedAssigneeName = map.get("suggestedAssigneeName") != null
                        ? map.get("suggestedAssigneeName").toString()
                        : null;

                result.add(new AiGeneratedSubTaskDTO(
                        title, description, priority, estimatedDays,
                        suggestedDeadline, suggestedAssigneeId, suggestedAssigneeName
                ));
            }

            return result;
        } catch (Exception e) {
            log.error("Lỗi khi parse JSON từ Gemini: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi định dạng dữ liệu AI trả về: " + e.getMessage());
        }
    }
}
