package worksys.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import worksys.dto.TaskDTO;
import worksys.service.TaskService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // Tạo task mới qua Multipart Form-Data (cho phép đính kèm file mô tả chi tiết nhiệm vụ)
    @PostMapping(consumes = { "multipart/form-data" })
    public TaskDTO createTaskMultipart(
            @RequestParam("projectId") Long projectId,
            @RequestParam(value = "assignedToIds", required = false) List<Long> assignedToIds,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "deadline", required = false) String deadline,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "attachmentUrl", required = false) String attachmentUrl) {
        String finalAttachmentUrl = attachmentUrl;

        // Xử lý lưu file đính kèm vào thư mục uploads
        if (file != null && !file.isEmpty()) {
            try {
                Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
                Files.createDirectories(uploadPath);
                String originalName = file.getOriginalFilename();
                String safeName = UUID.randomUUID() + "_"
                        + (originalName != null ? originalName.replaceAll("[^a-zA-Z0-9._-]", "_") : "attachment");
                Path target = uploadPath.resolve(safeName);
                file.transferTo(target);
                finalAttachmentUrl = "/api/files/" + safeName;
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu file đính kèm");
            }
        }

        LocalDate parsedDeadline = parseDeadlineToLocalDate(deadline);

        return taskService.createTaskDTO(projectId, assignedToIds, title, description, parsedDeadline, finalAttachmentUrl);
    }

    // Tạo task mới qua JSON Body (tương thích ngược và tiện khi không gửi file)
    @PostMapping(consumes = { "application/json" })
    public TaskDTO createTask(@RequestBody CreateTaskRequest request) {
        LocalDate deadline = parseDeadlineToLocalDate(request.deadline);
        return taskService.createTaskDTO(request.projectId, request.assignedToIds, request.title, request.description,
                deadline, request.attachmentUrl);
    }

    // Lấy task theo ID (response DTO)
    @GetMapping("/{id}")
    public TaskDTO getTaskById(@PathVariable Long id) {
        return taskService.getTaskByIdDTO(id);
    }

    // Lấy tất cả tasks (response DTO)
    @GetMapping
    public List<TaskDTO> getAllTasks() {
        return taskService.getAllTasksDTO();
    }

    // Lấy tasks theo project (response DTO)
    @GetMapping("/project/{projectId}")
    public List<TaskDTO> getTasksByProject(@PathVariable Long projectId) {
        return taskService.getTasksByProjectDTO(projectId);
    }

    // Lấy tasks theo user (response DTO)
    @GetMapping("/user/{userId}")
    public List<TaskDTO> getTasksByUser(@PathVariable Long userId) {
        return taskService.getTasksByUserDTO(userId);
    }

    // Cập nhật task (response DTO) - kiểm tra quyền trong service
    @PutMapping("/{id}")
    public TaskDTO updateTask(@PathVariable Long id, @RequestBody UpdateTaskRequest request) {
        LocalDate deadline = parseDeadlineToLocalDate(request.deadline);
        try {
            return taskService.updateTaskDTO(id, request.title, request.description, deadline);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    // Cập nhật trạng thái task (Dành cho Admin / Manager kéo thả Kanban)
    @PatchMapping("/{id}/status")
    public TaskDTO updateTaskStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        try {
            worksys.entity.TaskStatus newStatus = worksys.entity.TaskStatus.valueOf(request.status);
            return taskService.updateTaskStatusDTO(id, newStatus);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    // Hàm tiện ích phân tích chuỗi deadline từ client (hỗ trợ cả định dạng YYYY-MM-DD và YYYY-MM-DDTHH:mm:ss)
    private LocalDate parseDeadlineToLocalDate(String deadlineStr) {
        if (deadlineStr == null || deadlineStr.isBlank()) return null;
        if (deadlineStr.contains("T")) {
            return LocalDate.parse(deadlineStr.substring(0, deadlineStr.indexOf("T")));
        }
        if (deadlineStr.contains(" ")) {
            return LocalDate.parse(deadlineStr.substring(0, deadlineStr.indexOf(" ")));
        }
        return LocalDate.parse(deadlineStr);
    }

    // Xóa task - chỉ ADMIN
    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        try {
            taskService.deleteTask(id);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    // Member nhận task (response DTO)
    @PostMapping("/{taskId}/accept")
    public TaskDTO acceptTask(
            @PathVariable Long taskId,
            @RequestParam Long memberId) {
        return taskService.acceptTaskDTO(taskId, memberId);
    }

    // Member nộp task với file hoặc đường link
    @PostMapping(value = "/{taskId}/submit", consumes = { "multipart/form-data", "application/x-www-form-urlencoded",
            "application/json" })
    public TaskDTO submitTask(
            @PathVariable Long taskId,
            @RequestParam Long memberId,
            @RequestParam(required = false) String submissionLink,
            @RequestParam(required = false) MultipartFile file) {
        String finalLink = submissionLink;

        if (file != null && !file.isEmpty()) {
            try {
                Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
                Files.createDirectories(uploadPath);
                String originalName = file.getOriginalFilename();
                String safeName = UUID.randomUUID() + "_"
                        + (originalName != null ? originalName.replaceAll("[^a-zA-Z0-9._-]", "_") : "file");
                Path target = uploadPath.resolve(safeName);
                file.transferTo(target);
                finalLink = "/api/files/" + safeName;
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu file");
            }
        }

        if (finalLink == null || finalLink.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải nộp file hoặc địa chỉ liên kết");
        }

        try {
            return taskService.submitTaskDTO(taskId, memberId, finalLink);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    // Endpoint cho phép thành viên hủy bài đã nộp.
    // Sau khi hủy, submissionLink bị xóa và task chuyển về IN_PROGRESS để có thể nộp lại.
    // Chỉ assignee của task mới được gọi endpoint này (kiểm tra trong TaskService).
    @DeleteMapping("/{taskId}/submit")
    public TaskDTO unsubmitTask(
            @PathVariable Long taskId,
            @RequestParam Long memberId) {
        try {
            return taskService.unsubmitTaskDTO(taskId, memberId);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }


    public static class CreateTaskRequest {
        public Long projectId;
        public List<Long> assignedToIds;
        public String title;
        public String description;
        public String deadline; // ISO string "yyyy-MM-dd" từ frontend
        public String attachmentUrl; // URL file đính kèm
    }

    public static class UpdateTaskRequest {
        public String title;
        public String description;
        public String deadline; // ISO string "yyyy-MM-dd" từ frontend
    }

    public static class UpdateStatusRequest {
        public String status; // TODO, IN_PROGRESS, SUBMITTED, DONE
    }
}
