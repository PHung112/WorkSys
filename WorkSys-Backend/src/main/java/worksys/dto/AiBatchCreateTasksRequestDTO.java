package worksys.dto;

import java.util.List;

/**
 * DTO nhận danh sách các task mà người dùng đã duyệt và chỉnh sửa từ Frontend
 * để gửi xuống Backend thực hiện Transactional Batch Insert vào cơ sở dữ liệu.
 */
public class AiBatchCreateTasksRequestDTO {

    // Danh sách các task con cần tạo
    private List<CreateSubTaskItemDTO> tasks;

    public AiBatchCreateTasksRequestDTO() {
    }

    public AiBatchCreateTasksRequestDTO(List<CreateSubTaskItemDTO> tasks) {
        this.tasks = tasks;
    }

    public List<CreateSubTaskItemDTO> getTasks() {
        return tasks;
    }

    public void setTasks(List<CreateSubTaskItemDTO> tasks) {
        this.tasks = tasks;
    }

    /**
     * DTO chi tiết cho từng task trong danh sách batch insert
     */
    public static class CreateSubTaskItemDTO {
        private String title;
        private String description;
        private String deadline; // YYYY-MM-DD
        private List<Long> assigneeIds; // Danh sách ID người thực hiện
        private String priority;
        private String attachmentUrl;

        public CreateSubTaskItemDTO() {
        }

        public CreateSubTaskItemDTO(String title, String description, String deadline,
                                    List<Long> assigneeIds, String priority, String attachmentUrl) {
            this.title = title;
            this.description = description;
            this.deadline = deadline;
            this.assigneeIds = assigneeIds;
            this.priority = priority;
            this.attachmentUrl = attachmentUrl;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getDeadline() {
            return deadline;
        }

        public void setDeadline(String deadline) {
            this.deadline = deadline;
        }

        public List<Long> getAssigneeIds() {
            return assigneeIds;
        }

        public void setAssigneeIds(List<Long> assigneeIds) {
            this.assigneeIds = assigneeIds;
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }

        public String getAttachmentUrl() {
            return attachmentUrl;
        }

        public void setAttachmentUrl(String attachmentUrl) {
            this.attachmentUrl = attachmentUrl;
        }
    }
}
