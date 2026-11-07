package worksys.dto;

/**
 * DTO nhận dữ liệu yêu cầu phân rã tính năng từ Frontend gửi lên Backend
 * Ví dụ: Người dùng muốn bẻ nhỏ tính năng "Xác thực 2 lớp 2FA"
 */
public class AiTaskDecomposeRequestDTO {

    // Tên tính năng hoặc mục tiêu lớn cần AI phân rã (bắt buộc)
    // Ví dụ: "Tích hợp đăng nhập Google OAuth2 & bảo mật JWT"
    private String featureGoal;

    // Yêu cầu kỹ thuật bổ sung hoặc lưu ý riêng của team (tùy chọn)
    // Ví dụ: "Cần lưu refresh token vào database, kiểm tra domain email @company.com"
    private String additionalRequirements;

    // Hạn chót mong muốn hoàn thành toàn bộ tính năng (định dạng YYYY-MM-DD, tùy chọn)
    private String targetDeadline;

    public AiTaskDecomposeRequestDTO() {
    }

    public AiTaskDecomposeRequestDTO(String featureGoal, String additionalRequirements, String targetDeadline) {
        this.featureGoal = featureGoal;
        this.additionalRequirements = additionalRequirements;
        this.targetDeadline = targetDeadline;
    }

    public String getFeatureGoal() {
        return featureGoal;
    }

    public void setFeatureGoal(String featureGoal) {
        this.featureGoal = featureGoal;
    }

    public String getAdditionalRequirements() {
        return additionalRequirements;
    }

    public void setAdditionalRequirements(String additionalRequirements) {
        this.additionalRequirements = additionalRequirements;
    }

    public String getTargetDeadline() {
        return targetDeadline;
    }

    public void setTargetDeadline(String targetDeadline) {
        this.targetDeadline = targetDeadline;
    }
}
