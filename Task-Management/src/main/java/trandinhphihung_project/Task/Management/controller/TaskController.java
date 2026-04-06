package trandinhphihung_project.Task.Management.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import trandinhphihung_project.Task.Management.dto.TaskDTO;
import trandinhphihung_project.Task.Management.service.TaskService;

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

    // Tạo task mới - nhận JSON (response DTO)
    @PostMapping
    public TaskDTO createTask(@RequestBody CreateTaskRequest request) {
        LocalDate deadline = (request.deadline != null && !request.deadline.isBlank())
                ? LocalDate.parse(request.deadline)
                : null;
        return taskService.createTaskDTO(request.projectId, request.assignedToId, request.title, request.description,
                deadline);
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
        LocalDate deadline = (request.deadline != null && !request.deadline.isBlank())
                ? LocalDate.parse(request.deadline)
                : null;
        try {
            return taskService.updateTaskDTO(id, request.title, request.description, deadline);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
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

    // DTO classes
    public static class CreateTaskRequest {
        public Long projectId;
        public Long assignedToId;
        public String title;
        public String description;
        public String deadline; // ISO string "yyyy-MM-dd" từ frontend
    }

    public static class UpdateTaskRequest {
        public String title;
        public String description;
        public String deadline; // ISO string "yyyy-MM-dd" từ frontend
    }
}
