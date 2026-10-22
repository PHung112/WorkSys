package worksys.dto;

import java.util.List;

/**
 * DTO đại diện cho một nhiệm vụ con (Sub-task) được Google Gemini AI tự động phân rã
 * Dữ liệu này sẽ được trả về Frontend để hiển thị trong giao diện Preview & Edit.
 */
public class AiGeneratedSubTaskDTO {

    // Tiêu đề ngắn gọn của task con
    // Ví dụ: "Thiết kế Entity và bảng CSDL lưu Refresh Token"
    private String title;

    // Hướng dẫn kỹ thuật và tiêu chí hoàn thành chi tiết của task
    private String description;

    // Mức độ ưu tiên do AI ước lượng: "HIGH", "MEDIUM", "LOW"
    private String priority;

    // Số ngày ước tính hoàn thành (từ 1 đến 7 ngày)
    private Integer estimatedDays;

    // Hạn chót gợi ý (định dạng YYYY-MM-DD)
    private String suggestedDeadline;

    // ID thành viên trong dự án được AI gợi ý phân công (có thể null nếu chưa gán)
    private Long suggestedAssigneeId;

    // Tên thành viên trong dự án được AI gợi ý
    private String suggestedAssigneeName;

    public AiGeneratedSubTaskDTO() {
    }

    public AiGeneratedSubTaskDTO(String title, String description, String priority,
                                 Integer estimatedDays, String suggestedDeadline,
                                 Long suggestedAssigneeId, String suggestedAssigneeName) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.estimatedDays = estimatedDays;
        this.suggestedDeadline = suggestedDeadline;
        this.suggestedAssigneeId = suggestedAssigneeId;
        this.suggestedAssigneeName = suggestedAssigneeName;
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

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Integer getEstimatedDays() {
        return estimatedDays;
    }

    public void setEstimatedDays(Integer estimatedDays) {
        this.estimatedDays = estimatedDays;
    }

    public String getSuggestedDeadline() {
        return suggestedDeadline;
    }

    public void setSuggestedDeadline(String suggestedDeadline) {
        this.suggestedDeadline = suggestedDeadline;
    }

    public Long getSuggestedAssigneeId() {
        return suggestedAssigneeId;
    }

    public void setSuggestedAssigneeId(Long suggestedAssigneeId) {
        this.suggestedAssigneeId = suggestedAssigneeId;
    }

    public String getSuggestedAssigneeName() {
        return suggestedAssigneeName;
    }

    public void setSuggestedAssigneeName(String suggestedAssigneeName) {
        this.suggestedAssigneeName = suggestedAssigneeName;
    }
}
